const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = {
  profile: path.join(__dirname, '../uploads/photo/profilephoto'),
  articles: path.join(__dirname, '../uploads/articles'),
};

Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage for profile photos
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.profile);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      'profile-' +
        req.user.id +
        '-' +
        uniqueSuffix +
        path.extname(file.originalname)
    );
  },
});

// Storage for article images
const articleStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.articles);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      'article-' +
        (req.user?.id || 'unknown') +
        '-' +
        uniqueSuffix +
        path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: profileStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter,
});

const uploadArticle = multer({
  storage: articleStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for articles
  fileFilter: fileFilter,
});

module.exports = upload;
module.exports.uploadArticle = uploadArticle;
