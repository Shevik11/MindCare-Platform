// routes/commentRoutes.js
const express = require('express');
const router = express.Router();
const prisma = require('../db/db');
const auth = require('../middleware/auth');

// GET /api/comments/psychologist/:id - get all comments for a psychologist
router.get('/psychologist/:id', async (req, res) => {
  try {
    const comments = await prisma.comments.findMany({
      where: { psychologistId: parseInt(req.params.id) },
      include: {
        Users: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    // Map Users to User for frontend compatibility
    const mappedComments = comments.map(comment => {
      const { Users, ...rest } = comment;
      return {
        ...rest,
        User: Users || null,
      };
    });
    res.json(mappedComments);
  } catch (err) {
    console.error('Error getting comments:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// POST /api/comments - create a new comment (requires auth)
router.post('/', auth, async (req, res) => {
  try {
    const { psychologistId, rating, text } = req.body;

    if (!psychologistId || !rating || !text) {
      return res
        .status(400)
        .json({ msg: 'Please provide all required fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
    }

    const comment = await prisma.comments.create({
      data: {
        userId: req.user.id,
        psychologistId: parseInt(psychologistId),
        rating: parseInt(rating),
        text,
      },
      include: {
        Users: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Map Users to User for frontend compatibility
    const { Users, ...rest } = comment;
    const mappedComment = {
      ...rest,
      User: Users || null,
    };

    res.status(201).json(mappedComment);
  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
