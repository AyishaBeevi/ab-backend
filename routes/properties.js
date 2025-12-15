import express from "express";
import { protect, authorize } from "../middlewares/auth.js";
import { uploadArray, multerErrorHandler } from "../middlewares/upload.js";
import {
  createProperty,
  getProperties,
  updateProperty,
  deleteProperty,
  getPropertyBySlug,
  getAdvancedRelated,
  getAgentProperties
} from "../controllers/propertyController.js";
import { updateAvailability } from "../controllers/propertyController.js";
const router = express.Router();

/* ---------------- CREATE PROPERTY ---------------- */
router.post(
  "/",
  protect,
  authorize("agent", "admin"),
  uploadArray("images", 6),
  multerErrorHandler,
  createProperty
);

/* ---------------- STATIC ROUTES FIRST ---------------- */
router.get("/related/advanced/:slug", getAdvancedRelated);

router.get("/agent", protect, authorize("agent", "admin"), getAgentProperties);

/* ---------------- GET ALL PROPERTIES ---------------- */
router.get("/", getProperties);

/* ---------------- GET SINGLE PROPERTY (SLUG) ---------------- */
router.get("/:slug", getPropertyBySlug);

/* ---------------- UPDATE / DELETE ---------------- */

router.put("/:id", protect, authorize("agent", "admin"), uploadArray("newImages", 10), updateProperty);



router.delete("/:id", protect, authorize("agent", "admin"), deleteProperty);

router.patch(
  "/:id/availability",
  protect,
  authorize("agent", "admin"),
  updateAvailability
);



export default router;
