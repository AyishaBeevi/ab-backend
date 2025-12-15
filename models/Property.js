import mongoose from "mongoose";
import slugify from "slugify";

const propertySchema = new mongoose.Schema(
  {
    /* BASIC INFO */
    title: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, unique: true, index: true },
    description: { type: String, required: true, maxlength: 5000 },

    /* LISTING TYPE */
    listingType: {
      type: String,
      enum: ["rent", "sale"],
      required: true,
      index: true,
    },

    /* PRICING */
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "AED" },

    // RENT ONLY
    rentFrequency: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },
    deposit: { type: Number, min: 0 },

    /* MEDIA */
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],

    /* LOCATION */
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      address: { type: String, required: true },
      city: String,
      state: String,
      country: String,
    },

    /* DETAILS */
    bedrooms: { type: Number, default: 0 },
    bathrooms: { type: Number, default: 0 },
    area: { type: Number, required: true },
    amenities: { type: [String], default: [] },
    type: {
      type: String,
      enum: ["apartment", "villa", "plot", "commercial"],
      required: true,
    },
    furnished: { type: Boolean, default: false },

    /* OWNER */
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* FLAGS */
    status: {
      type: String,
      enum: ["available", "sold", "rented"],
      default: "available",
    },
    isApproved: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false },
    isTopPick: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/* SLUG */
propertySchema.pre("save", function () {
  if (!this.isModified("title") || this.slug) return;
  this.slug = `${slugify(this.title, { lower: true })}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
});

/* INDEXES */
propertySchema.index({ listingType: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ bedrooms: 1 });
propertySchema.index({ createdAt: -1 });
propertySchema.index({ "location.city": 1 });

export default mongoose.model("Property", propertySchema);
