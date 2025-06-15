const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');
const statsRouter = require('../stats');

jest.mock('fs');

const DATA_PATH = path.join(__dirname, '../../../data/items.json');

describe('Stats Router', () => {
  let app;
  const mockItems = [
    { id: 1, name: 'Item 1', price: 10 },
    { id: 2, name: 'Item 2', price: 20 }
  ];
  const mockStats = {
    mtime: { getTime: () => 1234567890 }
  };

  beforeEach(() => {
    app = express();
    app.use('/api/stats', statsRouter);
    jest.clearAllMocks();
  });

  it('should return stats correctly (happy path)', async () => {
    fs.statSync.mockReturnValue(mockStats);
    fs.readFileSync.mockReturnValue(JSON.stringify(mockItems));
    const response = await request(app).get('/api/stats');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      total: 2,
      averagePrice: 15
    });
  });

  it('should update cache if file is modified', async () => {
    // First call: empty cache
    fs.statSync.mockReturnValueOnce({ mtime: { getTime: () => 1 } });
    fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockItems));
    let response = await request(app).get('/api/stats');
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(2);

    // Second call: file modified
    fs.statSync.mockReturnValueOnce({ mtime: { getTime: () => 2 } });
    fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockItems));
    response = await request(app).get('/api/stats');
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(2);
  });

  it('should return error if it cannot calculate stats', async () => {
    fs.statSync.mockImplementation(() => { throw new Error('Failed to read stat'); });
    fs.readFileSync.mockImplementation(() => { throw new Error('Failed to read file'); });
    const response = await request(app).get('/api/stats');
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
  });

  it('should return average NaN if there are no items', async () => {
    fs.statSync.mockReturnValue(mockStats);
    fs.readFileSync.mockReturnValue(JSON.stringify([]));
    const response = await request(app).get('/api/stats');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      total: 0,
      averagePrice: NaN // division by zero
    });
  });
}); 