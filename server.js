import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';

import cookieParser from "cookie-parser";

// ROUTES
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import propertyRoutes from "./routes/properties.js";
import adminRoutes from "./routes/admin.js";
import publicContactRoute from "./routes/publicContactRoute.js";
import adminContactRoute from "./routes/adminContactRoute.js";

import { apiLimiter } from "./middlewares/rateLimiter.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import enquiryRoutes from "./routes/enquiries.js";

const app = express();

// ================== MIDDLEWARE ==================


const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS not allowed"), false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);



app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// rate limit only auth
app.use("/api/auth", apiLimiter);

// ================== ROUTES ==================
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/admin", adminRoutes);


app.use("/api/contact", publicContactRoute);          
app.use("/api/admin/contact", adminContactRoute);     

app.use("/api/enquiries", enquiryRoutes);


// ================== ERROR HANDLER (MUST BE LAST) ==================
app.use(errorHandler);

// ================== DATABASE ==================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// ================== SERVER ==================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
