import multer from "multer";
import path from "path";

// Set up disk storage for multer
const storage = multer.diskStorage({
  // Destination folder for uploaded files
  destination: (req, file, cb) => {
    cb(null, 'uploads/profileImages'); // Save to this folder
  },
  // Specify the filename format for the uploaded file
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + path.extname(file.originalname); // Append timestamp
    cb(null, file.fieldname + '-' + uniqueSuffix);
  },
});

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Optional: set file size limit (e.g., 5MB)
  fileFilter: (req, file, cb) => {
    // Optional: File type validation (allow only images)
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

export default upload;
