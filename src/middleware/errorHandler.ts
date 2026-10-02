import { Request, Response, NextFunction } from "express";

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
}

export function errorHandler(
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(err);

  // Body parser, multer and CORS rejections all carry their own status. Collapsing
  // them into 500 hides the cause behind a generic message in the client.
  const claimed = err.status ?? err.statusCode;
  const status =
    typeof claimed === "number" && claimed >= 400 && claimed <= 599 ? claimed : 500;

  res.status(status).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? status === 500
          ? "Internal server error"
          : err.message
        : err.message,
  });
}