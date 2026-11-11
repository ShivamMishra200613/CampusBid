export const errorHandler = (err, req, res, next) => {
  console.error('[Error]', err);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred.',
      details: err.details || null
    }
  });
};
