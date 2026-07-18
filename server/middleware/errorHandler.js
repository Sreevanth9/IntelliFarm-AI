export const errorHandler = (error, req, res, next) => {
  const status = error.statusCode || 500;
  const isOperational = status >= 400 && status < 500;
  const message = isOperational ? (error.message || "Request failed") : "Internal server error";

  if (process.env.NODE_ENV !== "test") {
    console.error(error);
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && error.data ? { data: error.data } : {}),
  });
};
