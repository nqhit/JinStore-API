const router = require('express').Router();
const { getAllUsers, getUserInfo, updateUser, deleteUser, updatePassword } = require('../controllers/userController');
const { verifyToken, verifyTokenAndAdmin } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const os = require('os');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use OS temp directory for temporary storage
    cb(null, os.tmpdir());
  },
  filename: function (req, file, cb) {
    // Generate a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// Admin routes
router.get('/', verifyTokenAndAdmin, getAllUsers);
router.delete('/delete', verifyTokenAndAdmin, deleteUser);

// Authenticated user routes
router.get('/info-user', verifyToken, getUserInfo);
router.patch('/info-user/update', verifyToken, upload.single('avatar'), updateUser);

// Public routes
router.patch('/reset-password', updatePassword);

module.exports = router;
