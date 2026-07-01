import rateLimit from "express-rate-limit";

// Brute-force protection for the login endpoint: max 10 FAILED attempts per IP
// / 15 min. Successful logins don't count, so a legit user who mistypes then
// signs in correctly is never locked out.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trop de tentatives de connexion. Réessayez dans quelques minutes." },
});

// Soft global limiter for the whole API (protects against scraping / abuse).
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trop de requêtes. Veuillez patienter un instant." },
});
