const errorMiddleware = (err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res
      .status(400)
      .json({ message: 'Image size should not exceed 5MB' });
  }

  if (err.message === 'Only jpg, png and webp images are allowed') {
    return res.status(400).json({ message: err.message });
  }

  // Generic fallback
  return res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
};

export default errorMiddleware;
