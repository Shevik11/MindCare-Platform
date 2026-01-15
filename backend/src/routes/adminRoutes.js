const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');

router.get('/stats', auth, adminAuth, adminController.getStats);
router.get(
  '/psychologists/pending',
  auth,
  adminAuth,
  adminController.getPendingPsychologists
);
router.get(
  '/psychologists',
  auth,
  adminAuth,
  adminController.getAllPsychologists
);
router.get(
  '/psychologists/:id',
  auth,
  adminAuth,
  adminController.getPsychologistById
);
router.post(
  '/psychologists/:id/block-temporary',
  auth,
  adminAuth,
  adminController.blockPsychologistTemporary
);
router.post(
  '/psychologists/:id/block-permanent',
  auth,
  adminAuth,
  adminController.blockPsychologistPermanent
);
router.post(
  '/psychologists/:id/unblock',
  auth,
  adminAuth,
  adminController.unblockPsychologist
);
router.post(
  '/psychologists/:id/approve',
  auth,
  adminAuth,
  adminController.approvePsychologist
);
router.post(
  '/psychologists/:id/reject',
  auth,
  adminAuth,
  adminController.rejectPsychologist
);
router.get(
  '/articles/pending',
  auth,
  adminAuth,
  adminController.getPendingArticles
);
router.get('/articles/all', auth, adminAuth, adminController.getAllArticles);
router.post(
  '/articles/:id/approve',
  auth,
  adminAuth,
  adminController.approveArticle
);
router.post(
  '/articles/:id/reject',
  auth,
  adminAuth,
  adminController.rejectArticle
);
router.put(
  '/articles/:id/status',
  auth,
  adminAuth,
  adminController.updateArticleStatus
);
router.delete('/articles/:id', auth, adminAuth, adminController.deleteArticle);
router.post('/create-admin', auth, adminAuth, adminController.createAdmin);

module.exports = router;
