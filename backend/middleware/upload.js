const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = {
  profile: path.join(__dirname, '../uploads/photo/profilephoto'),
  articles: path.join(__dirname, '../uploads/articles'),
  qualifications: path.join(__dirname, '../uploads/qualifications'),
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

// File filter for documents (PDF, images)
const documentFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/pdf',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Only PDF and image files (JPEG, PNG, GIF) are allowed for qualification documents!'
      ),
      false
    );
  }
};

// Storage for qualification documents
const qualificationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.qualifications);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      'qualification-' +
        (req.body?.email || 'unknown') +
        '-' +
        uniqueSuffix +
        path.extname(file.originalname)
    );
  },
});

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

const uploadQualification = multer({
  storage: qualificationStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for qualification documents
  fileFilter: documentFileFilter,
});

module.exports = upload;
module.exports.uploadArticle = uploadArticle;
module.exports.uploadQualification = uploadQualification;
