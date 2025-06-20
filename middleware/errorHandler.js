function errorHandler(err, req, res, next) {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    status: {
      message: err.message || 'Internal server error',
      code: err.code || 'INTERNAL_ERROR',
    },
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}

module.exports = { errorHandler }; 