// =============================================================================
// middleware/errorHandler.js — Centralized error handling
//
// Di production: stack trace TIDAK dikirim ke client (anti information leak).
// Di development: stack trace disertakan untuk debugging.
// =============================================================================

export function notFoundHandler(req, res, _next) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} tidak ditemukan.`,
  });
}

export function errorHandler(err, req, res, _next) {
  console.error(`[ERROR] ${err.message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production' && statusCode === 500
        ? 'Terjadi kesalahan internal server.'
        : err.message || 'Internal Server Error',
    // Stack trace hanya di development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

