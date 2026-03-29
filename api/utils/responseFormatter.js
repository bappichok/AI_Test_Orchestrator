/**
 * Response Formatter Utility
 * Standardizes API responses across the backend.
 */

export const successResponse = (res, data, status = 200) => {
  return res.status(status).json({
    success: true,
    timestamp: new Date().toISOString(),
    ...data
  });
};

export const errorResponse = (res, message, status = 500, raw = null) => {
  console.error(`[API Error] ${message}`, raw);
  return res.status(status).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...(raw && { detail: raw })
  });
};
