// server/controllers/propertyController.js
import Property from "../models/Property.js";
import { uploadBuffer } from "../services/cloudinary.js";

/* -----------------------------------------------------------
   HELPERS
------------------------------------------------------------ */

const toNum = (v) => (v ? Number(v) : undefined);

const normalize = (str) =>
  str ? String(str).trim().toLowerCase() : undefined;

const extractPublicId = (url) => {
  if (!url) return "";
  const parts = url.split("/");
  const last = parts[parts.length - 1];
  return last.split(".")[0]; // remove .jpg / .png etc.
};

/* -----------------------------------------------------------
   CREATE PROPERTY
------------------------------------------------------------ */
export const createProperty = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Images required" });
    }
if (!req.body.listingType) {
  return res.status(400).json({ message: "Listing type is required" });
}

    const images = await Promise.all(
      req.files.map((f) => uploadBuffer(f.buffer, f.mimetype))
    );

    const property = await Property.create({
      ...req.body,
      type: normalize(req.body.type),
      furnished: req.body.furnished === "true",

      price: toNum(req.body.price),
      bedrooms: toNum(req.body.bedrooms),
      bathrooms: toNum(req.body.bathrooms),
      area: toNum(req.body.area),

      agent: req.user._id,
      images,

      location: {
        type: "Point",
        coordinates: [],
        address: req.body.address,
        city: normalize(req.body.city),
        state: req.body.state,
        country: req.body.country,
      },

      isApproved: false,
      isActive: true,
    });

    res.status(201).json({ success: true, property });
  } catch (err) {
    console.error("CREATE PROPERTY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* -----------------------------------------------------------
   GET PROPERTIES (FILTER + SEARCH + SORT)
------------------------------------------------------------ */
export const getProperties = async (req, res) => {
  try {
    let {
      listingType,
      page = 1,
      limit = 12,
      search = "",
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      sort = "newest",
      city,
      type,
      furnished,
    } = req.query;

    page = Number(page);
    limit = Number(limit);

    const query = {
      isApproved: true,
      isActive: true,
    };

    /* SEARCH */
    if (search.trim() !== "") {
      query.$text = { $search: search };
    }

    if (listingType) {
      query.listingType = listingType;
    }

    /* PRICE RANGE */
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    /* BEDROOMS / BATHROOMS */
    if (bedrooms) query.bedrooms = Number(bedrooms);
    if (bathrooms) query.bathrooms = Number(bathrooms);

    /* CITY FILTER */
    if (city && city.trim() !== "") {
      query["location.city"] = normalize(city);
    }

    /* PROPERTY TYPE FILTER (FIXED) */
    if (type && type !== "" && type !== "all") {
      query.type = normalize(type);
    }

    /* FURNISHED FILTER */
    if (furnished) {
      query.furnished = furnished === "true";
    }

    /* SORT OPTIONS */
    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      lowprice: { price: 1 },
      highprice: { price: -1 },
    };

    const sortBy = sortOptions[sort] || sortOptions.newest;

    /* DEBUG: Remove after testing */
    console.log("FINAL QUERY →", query);

    const total = await Property.countDocuments(query);

    const properties = await Property.find(query)
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      properties,
    });
  } catch (err) {
    console.error("FILTER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* -----------------------------------------------------------
   GET BY SLUG
------------------------------------------------------------ */
export const getPropertyBySlug = async (req, res) => {
  try {
    const property = await Property.findOne({
      slug: req.params.slug,
      isApproved: true,
    }).populate("agent", "name email");

    if (!property) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({ property });
  } catch (err) {
    console.error("GET PROPERTY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* -----------------------------------------------------------
   UPDATE PROPERTY
------------------------------------------------------------ */
export const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Sometimes req.user.id is _id depending on your auth middleware
    const userId = req.user.id || req.user._id;

    if (property.agent.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    if (req.body.listingType) {
  property.listingType = req.body.listingType;
}


    /* ------------------------------------------
     |  UPDATE BASIC FIELDS SAFELY
     ------------------------------------------ */
    const allowedFields = [
      "title",
      "description",
      "price",
      "bedrooms",
      "bathrooms",
      "area",
      "address",
      "city",
      "state",
      "country",
      "type",
      "furnished",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        // Handle boolean coming from FormData ("true"/"false")
        if (field === "furnished") {
          property[field] = req.body[field] === "true" || req.body[field] === true;
        } else {
          property[field] = req.body[field];
        }
      }
    });

    /* ------------------------------------------
     |   HANDLE IMAGES: existing + new uploads
     ------------------------------------------ */

    let existingImages = [];

    // Step 1: process existing images sent from frontend
    if (req.body.existingImages) {
      try {
        const parsed = JSON.parse(req.body.existingImages);

        if (Array.isArray(parsed)) {
          existingImages = parsed.filter(Boolean);
        }
      } catch (err) {
        console.error("Failed to parse existingImages:", err);
      }
    }

    // Step 2: attach new uploaded images
    let newImages = [];
    if (req.files && req.files.length > 0) {
      newImages = req.files.map((file) => {
        return `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;
      });
    }

    // Final updated image list (ordered)
   property.images = [
  ...existingImages.map(url => ({
    url,
    publicId: extractPublicId(url)
  })),
  ...newImages.map(url => ({
    url,
    publicId: extractPublicId(url)
  }))
];



    /* ------------------------------------------
     | SAVE PROPERTY
     ------------------------------------------ */
    await property.save();

    return res.json({
      message: "Property updated successfully",
      property,
    });

  } catch (err) {
    console.error("UPDATE PROPERTY ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* -----------------------------------------------------------
   DELETE PROPERTY
------------------------------------------------------------ */
export const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Not found" });

    if (
      property.agent.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await property.deleteOne();
    res.json({ message: "Property removed" });
  } catch (err) {
    console.error("DELETE PROPERTY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* -----------------------------------------------------------
   RELATED PROPERTIES
------------------------------------------------------------ */
export const getAdvancedRelated = async (req, res) => {
  try {
    const main = await Property.findOne({
      slug: req.params.slug,
      isApproved: true,
    });

    if (!main) return res.status(404).json({ message: "Not found" });

    const priceMin = main.price * 0.8;
    const priceMax = main.price * 1.2;

    const related = await Property.find({
      _id: { $ne: main._id },
      "location.city": main.location.city,
      type: main.type,
      price: { $gte: priceMin, $lte: priceMax },
      bedrooms: { $gte: main.bedrooms - 1, $lte: main.bedrooms + 1 },
      isApproved: true,
    })
      .limit(6)
      .sort({ createdAt: -1 })
      .lean();

    res.json({ related });
  } catch (err) {
    console.error("RELATED ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const toggleFeatured = async (req, res) => {
  try {
    const p = await Property.findById(req.params.id);

    if (!p) return res.status(404).json({ message: "Property not found" });

    p.isFeatured = !p.isFeatured;
    await p.save();

    res.json({ success: true, isFeatured: p.isFeatured });
  } catch (err) {
  console.error("TOGGLE FEATURED ERROR:", err);
  res.status(500).json({ message: "Server error", error: err.message });
}

};

export const toggleTopPick = async (req, res) => {
  try {
    const p = await Property.findById(req.params.id);

    if (!p) return res.status(404).json({ message: "Property not found" });

    p.isTopPick = !p.isTopPick;
    await p.save();

    res.json({ success: true, isTopPick: p.isTopPick });
  } catch (err) {
  console.error("TOGGLE TOP PICK ERROR:", err);
  res.status(500).json({ message: "Server error", error: err.message });
}

};

export const getAgentProperties = async (req, res) => {
  try {
    const userId = req.user.id;

    const { sort, approval, availability } = req.query;

    const query = { agent: userId };

    // filter by approval (true/false)
    if (approval === "approved") query.isApproved = true;
    if (approval === "pending") query.isApproved = false;

    // filter by availability (available / sold / rented)
    if (availability) query.status = availability;

    // sorting logic
    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      lowprice: { price: 1 },
      highprice: { price: -1 },
    };

    const sortBy = sortMap[sort] || sortMap.newest;

    const properties = await Property.find(query).sort(sortBy);

    res.json(properties);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch agent properties" });
  }
};
export const updateAvailability = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // allow both admin + agent to change availability
    const userId = req.user.id || req.user._id;
    const isAdmin = req.user.role === "admin";
    const isOwner = property.agent.toString() === userId.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { status } = req.body;
    const valid = ["available", "sold", "rented"];

    if (!valid.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    property.status = status;
    await property.save();

    res.json({ success: true, status });
  } catch (err) {
    console.error("UPDATE AVAILABILITY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }

};

