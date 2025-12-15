import express from "express";
import Enquiry from "../models/Enquiry.js";
import Property from "../models/Property.js";
import User from "../models/User.js";
import transporter from "../services/mailer.js";
import { enquiryEmailTemplate } from "../services/emails/enquiryEmail.js";
import { protect,authorize } from "../middlewares/auth.js";
const router = express.Router();

/* ---------------- CREATE ENQUIRY ---------------- */
router.post("/", async (req, res) => {
  try {
    const { propertyId, name, contact, message, preferredContact } = req.body;

    const property = await Property.findById(propertyId).populate("agent");
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const enquiry = await Enquiry.create({
      property: property._id,
      propertyTitle: property.title,
      agent: property.agent?._id,
      name,
      contact,
      message,
      preferredContact,
    });

    // ---------------- EMAIL NOTIFICATION ----------------
const admins = await User.find({ role: "admin" }).select("email");
const recipients = [
  property.agent?.email,
  ...admins.map((a) => a.email),
].filter(Boolean);

const email = enquiryEmailTemplate({
  propertyTitle: property.title,
  propertySlug: property.slug,
  name,
  contact,
  message,
  preferredContact,
});

try {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: recipients,
    subject: email.subject,
    html: email.html,
  });
} catch (mailErr) {
  console.error("Email failed:", mailErr.message);
}


    /* ---------------- NOTIFY (EMAIL) ----------------
       Here you trigger Nodemailer to:
       - property.agent.email
       - all admins
    */

    res.status(201).json({ success: true, enquiry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create enquiry" });
  }
});

/* ---------------- AGENT ENQUIRIES ---------------- */
router.get(
  "/agent",
  protect,
  authorize("agent"),
  async (req, res) => {
    try {
      const enquiries = await Enquiry.find({
        agent: req.user._id,
      }).sort({ createdAt: -1 });

      res.json(enquiries);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch agent enquiries" });
    }
  }
);

/* ---------------- ADMIN ENQUIRIES ---------------- */
router.get(
  "/admin",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const enquiries = await Enquiry.find()
        .populate("agent", "name email")
        .sort({ createdAt: -1 });

      res.json(enquiries);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch admin enquiries" });
    }
  }
);


// ---------------- UPDATE ENQUIRY STATUS ----------------
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["new", "contacted", "closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!enquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }

    res.json({ success: true, enquiry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update enquiry" });
  }
});

export default router;
