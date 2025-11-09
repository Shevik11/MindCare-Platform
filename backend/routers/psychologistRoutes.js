// routes/psychologistRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../db/models/User');
const Psychologist = require('../db/models/Psychologist');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const psychologists = await Psychologist.findAll({
      include: [
        {
          model: User,
          attributes: ['firstName', 'lastName', 'email', 'role', 'photoUrl'],
        },
      ],
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
    const psychologist = await Psychologist.findByPk(req.params.id, {
      include: [
        {
          model: User,
          attributes: ['firstName', 'lastName', 'email', 'role', 'photoUrl'],
        },
      ],
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
      await User.update(userData, { where: { id: req.user.id } });
    }

    if (
      req.user.role === 'psychologist' &&
      Object.keys(psychologistData).length > 0
    ) {
      const [, created] = await Psychologist.findOrCreate({
        where: { userId: req.user.id },
        defaults: psychologistData,
      });

      if (!created) {
        await Psychologist.update(psychologistData, {
          where: { userId: req.user.id },
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
