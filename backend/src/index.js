const express = require('express');
const path = require('path');
const morgan = require('morgan');
const itemsRouter = require('./routes/items');
const statsRouter = require('./routes/stats');
const cors = require('cors');
const { getCookie, notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 3001;

// Basic middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/items', itemsRouter);
app.use('/api/stats', statsRouter);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Initialize cookie
getCookie().catch(console.error);

app.listen(port, () => console.log('Backend running on http://localhost:' + port));