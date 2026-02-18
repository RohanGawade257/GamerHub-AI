const jwt = require("jsonwebtoken");

function getSecret() {
  return process.env.JWT_SECRET || "hackathon_jwt_secret";
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization token is required" });
  }

  try {
    const token = authHeader.slice(7).trim();
    const decoded = jwt.verify(token, getSecret());
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
    };
    return next();
  } catch (_error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = {
  authMiddleware,
  getSecret,
};
