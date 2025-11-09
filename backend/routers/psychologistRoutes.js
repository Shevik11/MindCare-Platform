// routes/psychologistRoutes.js
const express = require('express');
const router = express.Router();
const prisma = require('../db/db');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const psychologists = await prisma.psychologist.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            photoUrl: true,
          },
        },
      },
    });
    console.log(`Returning ${psychologists.length} psychologists`);
    res.json(psychologists);
  } catch (err) {
    console.error('Error getting psychologists:', err);
    res.status(500).send('Server Error');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const psychologist = await prisma.psychologist.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            photoUrl: true,
          },
        },
      },
    });
    if (!psychologist) {
      return res.status(404).json({ msg: 'Psychologist not found' });
    }
    res.json(psychologist);
  } catch (err) {
    console.error('Error getting psychologist:', err);
    res.status(500).send('Server Error');
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const userFields = ['firstName', 'lastName', 'email'];
    const psychologistFields = ['specialization', 'experience', 'bio', 'price'];

    const userData = {};
    const psychologistData = {};

    for (const key of Object.keys(req.body)) {
      if (userFields.includes(key)) {
        userData[key] = req.body[key];
      }
    }

    if (req.user.role === 'psychologist') {
      for (const key of Object.keys(req.body)) {
        if (psychologistFields.includes(key)) {
          psychologistData[key] = req.body[key];
        }
      }
    }

    if (Object.keys(userData).length > 0) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: userData,
      });
    }

    if (
      req.user.role === 'psychologist' &&
      Object.keys(psychologistData).length > 0
    ) {
      const existingPsychologist = await prisma.psychologist.findUnique({
        where: { userId: req.user.id },
      });

      if (existingPsychologist) {
        await prisma.psychologist.update({
          where: { userId: req.user.id },
          data: psychologistData,
        });
      } else {
        await prisma.psychologist.create({
          data: {
            userId: req.user.id,
            ...psychologistData,
          },
        });
      }
    }

    res.json({ msg: 'Profile updated' });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
