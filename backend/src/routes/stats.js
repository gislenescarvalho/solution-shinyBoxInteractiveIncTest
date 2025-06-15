const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { mean } = require('../utils/stats');
const DATA_PATH = path.join(__dirname, '../../data/items.json');

// Cache and state
let statsCache = null;
let lastModified = null;

// Function to calculate statistics
function calculateStats(items) {
  return {
    total: items.length,
    averagePrice: mean(items.map(item => item.price))
  };
}

// Function to check if file has been modified
function checkFileModified() {
  try {
    const stats = fs.statSync(DATA_PATH);
    return lastModified !== stats.mtime.getTime();
  } catch (err) {
    return true; // If we can't read the file, assume it was modified
  }
}

// Function to update cache
function updateCache() {
  try {
    const raw = fs.readFileSync(DATA_PATH);
    const items = JSON.parse(raw);
    statsCache = calculateStats(items);
    lastModified = fs.statSync(DATA_PATH).mtime.getTime();
  } catch (err) {
    console.error('Error updating cache:', err);
    statsCache = null;
    lastModified = null;
  }
}

// GET /api/stats
router.get('/', (req, res, next) => {
  try {
    // Check if cache needs to be updated
    if (!statsCache || checkFileModified()) {
      updateCache();
    }

    if (!statsCache) {
      throw new Error('Could not calculate statistics');
    }

    res.json(statsCache);
  } catch (err) {
    next(err);
  }
});

module.exports = router;