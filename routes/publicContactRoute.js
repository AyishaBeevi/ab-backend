import express from "express";
import Contact from "../models/Contact.js";

const router = express.Router();

// Public: submit message
router.post("/", async (req, res) => {
  try {
    const msg = new Contact(req.body);
    await msg.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
