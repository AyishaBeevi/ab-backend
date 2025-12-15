import User from "../models/User.js";
import mongoose from "mongoose";

/**
 * TOGGLE FAVORITE
 * PATCH /api/users/favorite/:id
 */
export const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const propertyId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({ message: "Invalid property id" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadyFavorited = user.favorites.some(
      (fav) => fav.toString() === propertyId
    );

    if (alreadyFavorited) {
      user.favorites.pull(propertyId);
    } else {
      user.favorites.push(propertyId);
    }

    await user.save();

    return res.json({
      success: true,
      isFavorited: !alreadyFavorited,
      favorites: user.favorites,
    });
  } catch (err) {
    console.error("TOGGLE FAVORITE ERROR:", err);
    return res.status(500).json({ message: "Failed to toggle favorite" });
  }
};

/**
 * GET FAVORITES
 * GET /api/users/favorites
 */
export const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: "favorites",
        match: { isApproved: true, isActive: true },
      });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user.favorites || []);
  } catch (err) {
    console.error("GET FAVORITES ERROR:", err);
    return res.status(500).json({ message: "Failed to load favorites" });
  }
};
