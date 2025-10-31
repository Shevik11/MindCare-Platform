// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../db/models/User');
const Psychologist = require('../db/models/Psychologist');
const auth = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, role, firstName, lastName, specialization, experience, bio, price } = req.body;
  try {
    let user = await User.findOne({ where: { email } });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = await User.create({ email, password: hashedPassword, role: role || 'patient', firstName, lastName });
    console.log('User created:', { id: user.id, role: user.role, email: user.email });

   
    if (user.role === 'psychologist') {
      const psychologist = await Psychologist.create({
        userId: user.id,
        specialization,
        experience: experience ? Number.parseInt(experience) : 0,
        bio,
        price: price ? Number.parseFloat(price) : 0
      });
      console.log('Psychologist created:', { id: psychologist.id, userId: psychologist.userId });
    }

    const payload = { user: { id: user.id, role: user.role, email: user.email, firstName: user.firstName, lastName: user.lastName } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, user: payload.user });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).send('Server error');
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = { user: { id: user.id, role: user.role, email: user.email, firstName: user.firstName, lastName: user.lastName } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, user: payload.user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    let userData = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    };
    
   
    if (user.role === 'psychologist') {
      const psychologist = await Psychologist.findOne({ where: { userId: user.id } });
      if (psychologist) {
        userData.psychologist = {
          specialization: psychologist.specialization,
          experience: psychologist.experience,
          bio: psychologist.bio,
          price: psychologist.price
        };
      }
    }
    
    res.json(userData);
  } catch (err) {
    console.error('Get me error:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;