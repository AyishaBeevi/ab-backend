import express from "express";
import Contact from "../models/Contact.js";

const router = express.Router();

// GET (with sorting + filtering + searching)
router.get("/", async (req, res) => {
  try {
    const { unread, archived, search, sort } = req.query;

    const filter = {};
    if (unread === "true") filter.isRead = false;
    if (archived === "true") filter.archived = true;
    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { contact: new RegExp(search, "i") },
        { message: new RegExp(search, "i") },
      ];
    }

    const sortOption =
      sort === "newest" ? { createdAt: -1 } :
      sort === "oldest" ? { createdAt: 1 } :
      { isRead: 1, createdAt: -1 }; // unread first

    const msgs = await Contact.find(filter).sort(sortOption);
    res.json(msgs);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch contact messages" });
  }
});

// MARK AS READ
router.patch("/:id/read", async (req, res) => {
  try {
    const updated = await Contact.findByIdAndUpdate(
      req.params.id,
      { $set: { isRead: true } },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

// ARCHIVE MESSAGE
router.patch("/:id/archive", async (req, res) => {
  try {
    const updated = await Contact.findByIdAndUpdate(
      req.params.id,
      { $set: { archived: true } },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to archive" });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete message" });
  }
});

export default router;
