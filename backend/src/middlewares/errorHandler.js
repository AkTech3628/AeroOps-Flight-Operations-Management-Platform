const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  const status = err.status
    || (err.name === 'ValidationError' ? 400 : null)
    || (err.name === 'CastError' ? 400 : null)
    || (err.code === 11000 ? 409 : null)
    || 500;
  res.status(status).json({
    error: err.code === 11000
      ? 'A flight with this flight number already exists'
      : err.message || 'Something went wrong',
  });
};

module.exports = errorHandler;