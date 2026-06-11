const multer = require("multer");

// Use memory storage for Cloudinary (files are stored in buffer memory)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype && (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")))
    return cb(null, true);
  cb(new Error("Only image and video files are allowed"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
});

module.exports = { upload };
