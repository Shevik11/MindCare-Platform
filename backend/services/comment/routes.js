const express = require('express');
const router = express.Router();
const prisma = require('../../shared/db');
const auth = require('../../shared/middleware/auth');

// GET /psychologist/:id
router.get('/psychologist/:id', async (req, res) => {
  try {
    const comments = await prisma.comments.findMany({
      where: { psychologistId: parseInt(req.params.id) },
      include: { Users: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const mapped = comments.map(({ Users, ...rest }) => ({ ...rest, User: Users || null }));
    res.json(mapped);
  } catch (err) {
    console.error('Error getting comments:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// POST /
router.post('/', auth, async (req, res) => {
  try {
    const { psychologistId, rating, text } = req.body;

    if (!psychologistId || !rating || !text) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
    }

    const comment = await prisma.comments.create({
      data: { userId: req.user.id, psychologistId: parseInt(psychologistId), rating: parseInt(rating), text },
      include: { Users: { select: { firstName: true, lastName: true } } },
    });

    const { Users, ...rest } = comment;
    res.status(201).json({ ...rest, User: Users || null });
  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
