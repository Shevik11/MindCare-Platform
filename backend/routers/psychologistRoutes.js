// routes/psychologistRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../db/models/User');
const Psychologist = require('../db/models/Psychologist');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const psychologists = await Psychologist.findAll({
      include: [{ model: User, attributes: ['firstName', 'lastName', 'email', 'role'] }],
     
    });
    res.json(psychologists);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

router.put('/profile', auth, async (req, res) => {
  if (req.user.role !== 'psychologist') {
    return res.status(403).json({ msg: 'Access denied' });
  }
  try {
   
    const userFields = ['firstName', 'lastName', 'email'];
    const psychologistFields = ['specialization', 'experience', 'bio', 'price'];
    
    const userData = {};
    const psychologistData = {};
    
   
    Object.keys(req.body).forEach(key => {
      if (userFields.includes(key)) {
        userData[key] = req.body[key];
      }
    });
    
   
    Object.keys(req.body).forEach(key => {
      if (psychologistFields.includes(key)) {
        psychologistData[key] = req.body[key];
      }
    });
    
   
    if (Object.keys(userData).length > 0) {
      await User.update(userData, { where: { id: req.user.id } });
    }
    
   
    if (Object.keys(psychologistData).length > 0) {
      const [psychologist, created] = await Psychologist.findOrCreate({
        where: { userId: req.user.id },
        defaults: psychologistData
      });
      
      if (!created) {
        await Psychologist.update(psychologistData, { where: { userId: req.user.id } });
      }
    }

    res.json({ msg: 'Profile updated' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;