const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const psychologistController = require('../controllers/psychologistController');

router.get('/', psychologistController.getAllPsychologists);
router.get('/:id', psychologistController.getPsychologistById);
router.put('/profile', auth, psychologistController.updateProfile);

module.exports = router;
