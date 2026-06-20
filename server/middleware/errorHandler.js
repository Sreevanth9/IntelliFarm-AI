export const errorHandler = (error, req, res, next) => {
  const status = error.statusCode || 500;
  const message = error.message || "Server error";

  if (process.env.NODE_ENV !== "test") {
    console.error(message);
  }

  res.status(status).json({
    success: false,
    message,
    data: error.data,
  });
};
