import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Extract JWT from Authorization header or cookies
 */
const getTokenFromRequest = (req) => {
  // Authorization: Bearer <token>
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    return req.headers.authorization.split(" ")[1];
  }

  // Cookie fallback (optional)
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  return null;
};

/**
 * Protect routes (JWT required)
 */
export const protect = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token missing",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, user not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Not authorized, token invalid",
    });
  }
};

/**
 * Role-based authorization
 * Usage: authorize("admin"), authorize("agent")
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: insufficient permissions",
      });
    }

    next();
  };
};
