const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const appointmentController = require('../controllers/appointmentController');

router.get(
  '/slots/:psychologistId',
  auth,
  appointmentController.getAvailableSlots
);
router.post('/', auth, appointmentController.createAppointment);
router.get('/my', auth, appointmentController.getPatientAppointments);
router.get(
  '/psychologist',
  auth,
  appointmentController.getPsychologistAppointments
);

module.exports = router;
