// Central error handler. Translates known errors into clean JSON responses.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // ApiError carries an explicit HTTP status.
  if (err.status) {
    return res.status(err.status).json({ message: err.message, ...(err.extra || {}) });
  }
  // Mongoose duplicate key (e.g. duplicate CIN / email).
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "champ";
    return res.status(409).json({ message: `Valeur déjà utilisée pour ${field}.` });
  }
  // Mongoose validation.
  if (err.name === "ValidationError") {
    return res.status(422).json({ message: err.message });
  }
  // Bad ObjectId in a route param.
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Identifiant invalide." });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({ message: "Erreur serveur." });
}

export function notFound(req, res) {
  res.status(404).json({ message: "Route introuvable." });
}
