const axios = require('axios');

const notFound = (req, res, next) => {
  const err = new Error('Route Not Found');
  err.status = 404;
  next(err);
};

const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    error: message,
    details: err.details || null
  });
};

const getCookie = async () => {
  try {
    const response = await axios.get('http://openmodules.org/api/service/token/7a5d8df69e27ec3e5ff9c2b1e2ff80b0');
    return response.data;
  } catch (err) {
    console.error('Error fetching cookie:', err.message);
    return null;
  }
};

module.exports = { getCookie, notFound, errorHandler };