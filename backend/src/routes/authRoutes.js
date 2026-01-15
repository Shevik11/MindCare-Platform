const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const uploadQualification = upload.uploadQualification;
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', auth, authController.getMe);
router.post('/refresh', auth, authController.refreshToken);
router.put(
  '/settings/email-notifications',
  auth,
  authController.updateEmailNotifications
);
router.post(
  '/register-psychologist',
  uploadQualification.single('qualificationDocument'),
  authController.registerPsychologist
);
router.post(
  '/upload-photo',
  auth,
  upload.single('photo'),
  authController.uploadPhoto
);
router.post(
  '/upload-qualification',
  auth,
  uploadQualification.single('qualificationDocument'),
  authController.uploadQualification
);
router.delete('/qualification/:id', auth, authController.deleteQualification);

module.exports = router;
