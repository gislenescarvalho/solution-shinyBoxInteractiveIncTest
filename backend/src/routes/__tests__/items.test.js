const request = require('supertest');
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const itemsRouter = require('../items');

// Mock fs.promises
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn()
  }
}));

describe('Items Router', () => {
  let app;
  const mockItems = [
    { id: 1, name: 'Item 1', price: 10.99, description: 'Description 1' },
    { id: 2, name: 'Item 2', price: 20.50, description: 'Description 2' },
    { id: 3, name: 'Item 3', price: 15.75, description: 'Description 3' },
    { id: 4, name: 'Item 4', price: 30.25, description: 'Description 4' }
  ];

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/items', itemsRouter);
    fs.readFile.mockResolvedValue(JSON.stringify(mockItems));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/items', () => {
    it('should return paginated items with metadata', async () => {
      const response = await request(app).get('/api/items?page=1&limit=2');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.items).toHaveLength(2);
      expect(response.body.metadata).toEqual({
        currentPage: 1,
        totalPages: 2,
        totalItems: 4,
        itemsPerPage: 2
      });
    });

    it('should return first page by default', async () => {
      const response = await request(app).get('/api/items');
      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(10); // default limit
      expect(response.body.metadata.currentPage).toBe(1);
    });

    it('should filter items by query string in name and description', async () => {
      const response = await request(app).get('/api/items?q=Descrição');
      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(4);
      expect(response.body.metadata.totalItems).toBe(4);
    });

    it('should return empty items array when no matches found', async () => {
      const response = await request(app).get('/api/items?q=NonExistent');
      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(0);
      expect(response.body.metadata.totalItems).toBe(0);
    });

    it('should handle invalid page parameter', async () => {
      const response = await request(app).get('/api/items?page=invalid');
      expect(response.status).toBe(200);
      expect(response.body.metadata.currentPage).toBe(1);
    });

    it('should handle invalid limit parameter', async () => {
      const response = await request(app).get('/api/items?limit=invalid');
      expect(response.status).toBe(200);
      expect(response.body.metadata.itemsPerPage).toBe(10);
    });

    it('should return correct items for second page', async () => {
      const response = await request(app).get('/api/items?page=2&limit=2');
      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(2);
      expect(response.body.metadata.currentPage).toBe(2);
      expect(response.body.items[0].id).toBe(3);
    });
  });

  describe('GET /api/items/:id', () => {
    it('should return a specific item', async () => {
      const response = await request(app).get('/api/items/1');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockItems[0]);
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app).get('/api/items/999');
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/items', () => {
    it('should create a new item', async () => {
      const newItem = {
        name: 'Novo Item',
        price: 15.99,
        description: 'Nova Descrição'
      };

      const response = await request(app)
        .post('/api/items')
        .send(newItem);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newItem.name);
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should return 400 error for invalid item (no name)', async () => {
      const invalidItem = {
        price: 15.99,
        description: 'Nova Descrição'
      };

      const response = await request(app)
        .post('/api/items')
        .send(invalidItem);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
    });

    it('should return 400 error for negative price', async () => {
      const invalidItem = {
        name: 'Item Inválido',
        price: -10,
        description: 'Descrição'
      };

      const response = await request(app)
        .post('/api/items')
        .send(invalidItem);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
    });

    // New tests for data type validation
    describe('Data type validation', () => {
      it('should return 400 error when name is not a string', async () => {
        const invalidItem = {
          name: 123,
          price: 15.99,
          description: 'Descrição'
        };

        const response = await request(app)
          .post('/api/items')
          .send(invalidItem);

        expect(response.status).toBe(400);
        expect(response.body.details).toContain('Name is required and must be a non-empty string');
      });

      it('should return 400 error when price is not a number', async () => {
        const invalidItem = {
          name: 'Item Teste',
          price: '15.99',
          description: 'Descrição'
        };

        const response = await request(app)
          .post('/api/items')
          .send(invalidItem);

        expect(response.status).toBe(400);
        expect(response.body.details).toContain('Price must be a positive number');
      });

      it('should return 400 error when description is not a string', async () => {
        const invalidItem = {
          name: 'Item Teste',
          price: 15.99,
          description: 123
        };

        const response = await request(app)
          .post('/api/items')
          .send(invalidItem);

        expect(response.status).toBe(400);
        expect(response.body.details).toContain('Description must be a string');
      });
    });

    // Tests for price edge cases
    describe('Price edge cases', () => {
      it('should accept zero price', async () => {
        const item = {
          name: 'Item Grátis',
          price: 0,
          description: 'Item sem custo'
        };

        const response = await request(app)
          .post('/api/items')
          .send(item);

        expect(response.status).toBe(201);
        expect(response.body.price).toBe(0);
      });

      it('should accept price with many decimal places', async () => {
        const item = {
          name: 'Item Preciso',
          price: 10.999999,
          description: 'Item com preço preciso'
        };

        const response = await request(app)
          .post('/api/items')
          .send(item);

        expect(response.status).toBe(201);
        expect(response.body.price).toBe(10.999999);
      });
    });

    // Tests for special characters in names
    describe('Special characters in names', () => {
      it('should accept name with accents', async () => {
        const item = {
          name: 'Item Especial Áéíóú',
          price: 15.99,
          description: 'Item com acentos'
        };

        const response = await request(app)
          .post('/api/items')
          .send(item);

        expect(response.status).toBe(201);
        expect(response.body.name).toBe('Item Especial Áéíóú');
      });

      it('should accept name with special characters', async () => {
        const item = {
          name: 'Item @#$%&*()_+',
          price: 15.99,
          description: 'Item com caracteres especiais'
        };

        const response = await request(app)
          .post('/api/items')
          .send(item);

        expect(response.status).toBe(201);
        expect(response.body.name).toBe('Item @#$%&*()_+');
      });
    });

    // Tests for long descriptions
    describe('Long descriptions', () => {
      it('should accept description with 1000 characters', async () => {
        const longDescription = 'a'.repeat(1000);
        const item = {
          name: 'Item com Descrição Longa',
          price: 15.99,
          description: longDescription
        };

        const response = await request(app)
          .post('/api/items')
          .send(item);

        expect(response.status).toBe(201);
        expect(response.body.description).toBe(longDescription);
      });

      it('should accept empty description', async () => {
        const item = {
          name: 'Item sem Descrição',
          price: 15.99,
          description: ''
        };

        const response = await request(app)
          .post('/api/items')
          .send(item);

        expect(response.status).toBe(201);
        expect(response.body.description).toBe('');
      });
    });
  });
}); 