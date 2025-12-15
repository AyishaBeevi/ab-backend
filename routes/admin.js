// server/routes/admin.js
import express from "express";
import User from "../models/User.js";
import Property from "../models/Property.js";
import { protect, authorize } from "../middlewares/auth.js";
import { logAdminAction } from "../services/audit.js";
import AuditLog from "../models/AuditLog.js";
import { toggleFeatured,toggleTopPick } from "../controllers/propertyController.js";
const router = express.Router();



// ✅ GET AUDIT LOGS
router.get(
  "/audit-logs",
  protect,
  authorize("admin"),
  async (req, res, next) => {
    try {
      const logs = await AuditLog.find()
        // .populate("performedBy", "name role")
        .sort({ createdAt: -1 })
        .limit(100);

      res.json(logs);
    } catch (err) {
      next(err);
    }
  }
);
/* ========== USERS ========== */

/**
 * GET /api/admin/users
 * Admin – list all users
 */
router.get(
  "/users",
  protect,
  authorize("admin"),
  async (req, res, next) => {
    try {
      const users = await User.find().select("-password -passwordHash");
      res.json(users);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/admin/users/:id/role
 * Admin – change role (user/agent/admin)
 */
router.patch(
  "/users/:id/role",
  protect,
  authorize("admin"),
  async (req, res, next) => {
    try {
      const { role } = req.body;

      if (!["user", "agent", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true }
      ).select("-password -passwordHash");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await logAdminAction({
        adminId: req.user._id,
        action: "ROLE_CHANGED",
        targetType: "User",
        targetId: user._id,
        meta: { newRole: role },
      });

      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

/* ========== PROPERTIES ========== */

/**
 * GET /api/admin/properties
 * Admin – list all properties (no filters, full power)
 */
router.get(
  "/properties",
  protect,
  authorize("admin"),
  async (req, res, next) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 30;
      const skip = (page - 1) * limit;

      const [properties, total] = await Promise.all([
        Property.find()
          .populate("agent", "name email role")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),

        Property.countDocuments(),
      ]);

      res.json({
        properties,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/admin/properties
 * Admin – create property (optionally on behalf of an agent)
 */
router.post(
  "/properties",
  protect,
  authorize("admin"),
  async (req, res, next) => {
    try {
      const {
        title,
        description,
        price,
        currency,
        images,
        location,
        bedrooms,
        bathrooms,
        area,
        amenities,
        type,
        furnished,
        status,
        agentId,
      } = req.body;

      const property = await Property.create({
        title,
        description,
        price,
        currency: currency || "INR",
        images: images || [],
        location,
        bedrooms,
        bathrooms,
        area,
        amenities,
        type,
        furnished: !!furnished,
        status: status || "available",
        isApproved: true, // admin-created → auto approved
        agent: agentId || req.user._id,
      });

      await logAdminAction({
        adminId: req.user._id,
        action: "PROPERTY_CREATED",
        targetType: "Property",
        targetId: property._id,
        meta: { title: property.title },
      });

      res.status(201).json(property);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/admin/properties/:id/approve
 * Admin – approve or reject property
 * Body: { approved: true/false }
 */
router.patch(
  "/properties/:id/approve",
  protect,
  authorize("admin"),
  async (req, res, next) => {
    try {
      const { approved } = req.body;

      const property = await Property.findByIdAndUpdate(
        req.params.id,
        { isApproved: !!approved },
        { new: true }
      );

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      await logAdminAction({
        adminId: req.user._id,
        action: approved ? "PROPERTY_APPROVED" : "PROPERTY_REJECTED",
        targetType: "Property",
        targetId: property._id,
        meta: { title: property.title },
      });

      res.json(property);
    } catch (err) {
      next(err);
    }
  }
);


/**
 * DELETE /api/admin/properties/:id
 * Admin – delete any property
 */
router.delete(
  "/properties/:id",
  protect,
  authorize("admin"),
  async (req, res, next) => {
    try {
      const property = await Property.findByIdAndDelete(req.params.id);

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      await logAdminAction({
        adminId: req.user._id,
        action: "PROPERTY_DELETED",
        targetType: "Property",
        targetId: property._id,
        meta: { title: property.title },
      });

      res.json({ message: "Property deleted" });
    } catch (err) {
      next(err);
    }
  }
);

/* ========== AUDIT LOGS ========== */

/**
 * GET /api/admin/logs
 * Admin – view recent admin actions (paginated)
 */
router.get(
  "/logs",
  protect,
  authorize("admin"),
  async (req, res, next) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        // lazy import to avoid circular if you want, or import at top
        (await import("../models/AuditLog.js")).default
          .find()
          .populate("admin", "name email")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        (await import("../models/AuditLog.js")).default.countDocuments(),
      ]);

      res.json({
        logs,
        page,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      next(err);
    }
  }
);
router.patch("/properties/:id/featured", protect, authorize("admin"), toggleFeatured);
router.patch("/properties/:id/top-pick", protect, authorize("admin"), toggleTopPick);

export default router;
