const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const { uploadArticle } = require('../middleware/upload');
const articleController = require('../controllers/articleController');

router.get('/', articleController.getAllArticles);
router.get('/user/my', auth, articleController.getMyArticles);
router.get('/:id', optionalAuth, articleController.getArticleById);
router.post('/', auth, articleController.createArticle);
router.put('/:id', auth, articleController.updateArticle);
router.delete('/:id', auth, articleController.deleteArticle);
router.post(
  '/upload-image',
  auth,
  uploadArticle.single('image'),
  articleController.uploadArticleImage
);

module.exports = router;
