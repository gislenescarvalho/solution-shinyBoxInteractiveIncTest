const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

// Utility to read data (async version)
async function readData() {
  const raw = await fs.readFile(DATA_PATH, 'utf8');
  return JSON.parse(raw);
}

// Validation function
function validateItem(item) {
  const errors = [];
  
  if (!item.name || typeof item.name !== 'string' || item.name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string');
  }
  
  if (item.price !== undefined) {
    if (typeof item.price !== 'number' || item.price < 0) {
      errors.push('Price must be a positive number');
    }
  }
  
  if (item.description !== undefined && typeof item.description !== 'string') {
    errors.push('Description must be a string');
  }
  
  if (errors.length > 0) {
    const error = new Error('Invalid data');
    error.status = 400;
    error.details = errors;
    throw error;
  }
  
  return true;
}

// GET /api/items
router.get('/', async (req, res, next) => {
  try {
    const data = await readData();
    const { page = 1, limit = 10, q } = req.query;
    let results = data;

    // Apply search filter if query parameter exists
    if (q) {
      results = results.filter(item => 
        item.name.toLowerCase().includes(q.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(q.toLowerCase()))
      );
    }

    // Calculate pagination
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const startIndex = (pageNumber - 1) * limitNumber;
    const endIndex = pageNumber * limitNumber;
    const totalItems = results.length;
    const totalPages = Math.ceil(totalItems / limitNumber);

    // Slice the results for pagination
    const paginatedResults = results.slice(startIndex, endIndex);

    // Return paginated results with metadata
    res.json({
      items: paginatedResults,
      metadata: {
        currentPage: pageNumber,
        totalPages,
        totalItems,
        itemsPerPage: limitNumber
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id
router.get('/:id', async (req, res, next) => {
  try {
    const data = await readData();
    const item = data.find(i => i.id === parseInt(req.params.id));
    if (!item) {
      const err = new Error('Item not found');
      err.status = 404;
      throw err;
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/items
router.post('/', async (req, res, next) => {
  try {
    const item = req.body;
    validateItem(item);
    
    const data = await readData();
    item.id = Date.now();
    data.push(item);
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
    res.status(201).json(item);
  } catch (err) {
    if (err.status === 400) {
      res.status(400).json({
        error: err.message,
        details: err.details
      });
    } else {
      next(err);
    }
  }
});

module.exports = router;