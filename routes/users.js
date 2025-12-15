import express from "express";
import User from "../models/User.js";
import { protect, authorize } from "../middlewares/auth.js";
import {
  toggleFavorite,
  getFavorites,
} from "../controllers/favoriteController.js";

const router = express.Router();

/**
 * GET /api/users
 * Admin – list all users
 */
router.get("/", protect, authorize("admin"), async (req, res) => {
  const users = await User.find().select("-password -passwordHash");
  res.json(users);
});

/**
 * DELETE /api/users/:id
 * Admin – delete user/agent
 */
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  if (req.user.id === req.params.id) {
    return res.status(400).json({ message: "Admin cannot delete self" });
  }

  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User removed successfully" });
});

/**
 * PATCH /api/users/:id/role
 * Admin – change role
 */
router.patch("/:id/role", protect, authorize("admin"), async (req, res) => {
  const { role } = req.body;

  if (!["user", "agent", "admin"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
  );

  res.json(user);
});


export default router;
