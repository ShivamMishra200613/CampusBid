export const errorHandler = (err, req, res, next) => {
  // Mongoose CastError (e.g., malformed ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: `Invalid ID value: ${err.value}`,
        details: [{ field: err.path, message: 'Invalid ID format' }]
      }
    });
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_KEY_ERROR',
        message: `Duplicate entry for ${field}.`,
        details: [{ field, message: `${field} must be unique` }]
      }
    });
  }

  // Mongoose schema ValidationError
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Schema validation error occurred.',
        details
      }
    });
  }

  // Generic or custom HTTP error
  const status = err.statusCode || 500;
  if (status >= 500) {
    console.error('[Unhandled Server Error]', err);
  }

  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred.',
      details: err.details || null
    }
  });
};
