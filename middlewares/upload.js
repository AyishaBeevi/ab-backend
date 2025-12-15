import multer from "multer";

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, WEBP allowed"));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 6,
  },
});

export const uploadArray = (field = "images", max = 6) =>
  upload.array(field, max);

export const multerErrorHandler = (err, req, res, next) => {
  if (!err) return next();
  return res.status(400).json({ message: err.message });
};
