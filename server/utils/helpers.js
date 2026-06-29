// Wraps an async route handler so thrown errors reach the Express error middleware.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Error carrying an HTTP status code, handled by the central error middleware.
export class ApiError extends Error {
  constructor(status, message, extra) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

// Masks a CIN, revealing only the last 4 characters: "•••••678".
export function maskCin(cin) {
  if (!cin) return "";
  const s = String(cin);
  if (s.length <= 4) return s;
  return "•".repeat(s.length - 4) + s.slice(-4);
}
