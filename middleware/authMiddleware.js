const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Check token exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    // 2. Extract token
    const token = authHeader.split(" ")[1];

    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

req.userId = decoded.id;

if (!req.userId) {
  return res.status(401).json({
    message: "Invalid token payload",
  });
}
    // 4. IMPORTANT: set correct user id
    req.userId = decoded.id;

    if (!req.userId) {
      return res.status(401).json({
        message: "Invalid token payload",
      });
    }

    next();
  } catch (error) {
    console.log("Auth Error:", error.message);

    return res.status(401).json({
      message: "Unauthorized: Invalid token",
    });
  }
};

module.exports = authMiddleware;