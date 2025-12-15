
import rateLimit from "express-rate-limit";

/**
 * General API rate limiter
 * Limits each IP to 100 requests per 5 minutes
 */
export const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,   // 15 minutes
  max: 1200,                   // limit each IP
  message: {
    success: false,
    message: "Too many requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Stricter rate limiter for login/register to prevent brute force attacks
 * Limits each IP to 5 attempts per 10 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,   // 10 minutes
  max: 25,
  message: {
    success: false,
    message: "Too many failed attempts. Try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limit for file uploads — because users should not blast your server
 * Limits each IP to 20 upload attempts per day
 */
export const uploadLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,  // 24 hours
  max: 20,
  message: {
    success: false,
    message: "Upload limit reached for today.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
