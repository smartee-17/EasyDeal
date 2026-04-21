/**
 * @param {boolean} success - Status of the request
 * @param {string} message - Human-readable message
 * @param {object} data - The actual payload (user, token, etc.)
 */
export const sendResponse = (
  res,
  statusCode,
  success,
  message,
  data = null,
) => {
  return res.status(statusCode).json({
    success,
    message,
    data,
  });
};
