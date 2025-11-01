// routes/commentRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../db/models/User');
const Psychologist = require('../db/models/Psychologist');
const Comment = require('../db/models/Comment');
const auth = require('../middleware/auth');

// GET /api/comments/psychologist/:id - get all comments for a psychologist
router.get('/psychologist/:id', async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: { psychologistId: req.params.id },
      include: [{ model: User, attributes: ['firstName', 'lastName'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(comments);
  } catch (err) {
    console.error('Error getting comments:', err);
    res.status(500).send('Server Error');
  }
});

// POST /api/comments - create a new comment (requires auth)
router.post('/', auth, async (req, res) => {
  try {
    const { psychologistId, rating, text } = req.body;
    
    if (!psychologistId || !rating || !text) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
    }
    
    const comment = await Comment.create({
      userId: req.user.id,
      psychologistId,
      rating,
      text
    });
    
    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [{ model: User, attributes: ['firstName', 'lastName'] }]
    });
    
    res.status(201).json(commentWithUser);
  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

