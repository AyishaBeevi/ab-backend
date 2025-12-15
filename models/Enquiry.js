import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    propertyTitle: String,

    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    name: {
      type: String,
      required: true,
    },
    contact: {
      type: String,
      required: true,
    },
    message: String,

    preferredContact: {
      type: String,
      enum: ["call", "message"],
      default: "call",
    },

    status: {
      type: String,
      enum: ["new", "contacted", "closed"],
      default: "new",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Enquiry", enquirySchema);
