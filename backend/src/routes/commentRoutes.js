const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const commentController = require('../controllers/commentController');

router.get('/psychologist/:id', commentController.getCommentsByPsychologist);
router.post('/', auth, commentController.createComment);

module.exports = router;
