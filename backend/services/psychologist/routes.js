const express = require('express');
const router = express.Router();
const prisma = require('../../shared/db');
const auth = require('../../shared/middleware/auth');

// GET /
router.get('/', async (req, res) => {
  try {
    const psychologists = await prisma.psychologists.findMany({
      where: { status: 'approved' },
      include: {
        Users: { select: { firstName: true, lastName: true, email: true, role: true, photoUrl: true } },
      },
    });
    const mapped = psychologists.map(({ Users, price, ...rest }) => ({
      ...rest,
      User: Users || null,
      price: price != null ? parseFloat(price.toString()) : null,
    }));
    res.json(mapped);
  } catch (err) {
    console.error('Error getting psychologists:', err);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const psychologist = await prisma.psychologists.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        Users: { select: { firstName: true, lastName: true, email: true, role: true, photoUrl: true } },
      },
    });
    if (!psychologist) return res.status(404).json({ msg: 'Psychologist not found' });

    const { Users, price, ...rest } = psychologist;
    res.json({ ...rest, User: Users || null, price: price != null ? parseFloat(price.toString()) : null });
  } catch (err) {
    console.error('Error getting psychologist:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// PUT /profile
router.put('/profile', auth, async (req, res) => {
  try {
    const userFields = ['firstName', 'lastName', 'email'];
    const psychologistFields = ['specialization', 'experience', 'bio', 'price'];

    const userData = {};
    const psychologistData = {};

    for (const key of Object.keys(req.body)) {
      if (userFields.includes(key)) userData[key] = req.body[key];
    }
    if (req.user.role === 'psychologist') {
      for (const key of Object.keys(req.body)) {
        if (psychologistFields.includes(key)) psychologistData[key] = req.body[key];
      }
    }

    if (Object.keys(userData).length > 0) {
      await prisma.users.update({ where: { id: req.user.id }, data: userData });
    }

    if (req.user.role === 'psychologist' && Object.keys(psychologistData).length > 0) {
      const existing = await prisma.psychologists.findFirst({ where: { userId: req.user.id } });
      if (existing) {
        await prisma.psychologists.update({ where: { id: existing.id }, data: psychologistData });
      } else {
        await prisma.psychologists.create({ data: { userId: req.user.id, ...psychologistData } });
      }
    }

    res.json({ msg: 'Profile updated' });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
