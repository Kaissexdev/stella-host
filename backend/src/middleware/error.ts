import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "Not found" });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Validation failed", details: err.flatten() });
  }
  console.error("[error]", err);
  const status = typeof err?.status === "number" ? err.status : 500;
  res.status(status).json({ error: status === 500 ? "Internal server error" : err.message });
};
