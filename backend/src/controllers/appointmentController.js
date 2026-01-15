const appointmentService = require('../services/appointmentService');
const { sendAppointmentNotificationEmail } = require('../utils/email');

const getAvailableSlots = async (req, res) => {
  try {
    const psychologistId = Number.parseInt(req.params.psychologistId, 10);
    const result = await appointmentService.getAvailableSlots(psychologistId);
    res.json(result);
  } catch (err) {
    console.error('Get slots error:', err);
    if (err.message === 'Psychologist not found') {
      return res.status(404).json({ msg: err.message });
    }
    res.status(500).json({
      msg: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

const createAppointment = async (req, res) => {
  try {
    const { psychologistId, appointmentDateTime } = req.body;

    if (!psychologistId || !appointmentDateTime) {
      return res.status(400).json({
        msg: 'Psychologist ID and appointment date/time are required',
      });
    }

    if (req.user.role !== 'patient') {
      return res
        .status(403)
        .json({ msg: 'Only patients can book appointments' });
    }

    const parsedPsychologistId = Number.parseInt(String(psychologistId), 10);
    if (Number.isNaN(parsedPsychologistId)) {
      return res.status(400).json({ msg: 'Invalid psychologist ID' });
    }

    const { appointment, psychologist } =
      await appointmentService.createAppointment(
        parsedPsychologistId,
        req.user.id,
        appointmentDateTime
      );

    try {
      await sendAppointmentNotificationEmail({
        psychologistEmail: psychologist.Users.email,
        psychologistName: `${psychologist.Users.firstName} ${psychologist.Users.lastName}`,
        patientName: `${req.user.firstName} ${req.user.lastName}`,
        appointmentDateTime: appointment.appointmentDateTime,
      });
    } catch (emailError) {
      console.error(
        'Failed to send appointment notification email:',
        emailError
      );
    }

    res.status(201).json({
      id: appointment.id,
      appointmentDateTime: appointment.appointmentDateTime,
      status: appointment.status,
      psychologist: {
        id: appointment.Psychologists.id,
        specialization: appointment.Psychologists.specialization,
        user: appointment.Psychologists.Users,
      },
      patient: appointment.Patient,
    });
  } catch (err) {
    console.error('Create appointment error:', err);
    if (err.message === 'Psychologist not found') {
      return res.status(404).json({ msg: err.message });
    }
    if (err.message === 'This time slot is already booked') {
      return res.status(400).json({ msg: err.message });
    }
    if (err.message === 'Appointment must be in the future') {
      return res.status(400).json({ msg: err.message });
    }
    res.status(500).json({
      msg: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

const getPatientAppointments = async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res
        .status(403)
        .json({ msg: 'Only patients can view their appointments' });
    }

    const result = await appointmentService.getPatientAppointments(req.user.id);
    res.json(result);
  } catch (err) {
    console.error('Get my appointments error:', err);

    if (err.message && err.message.includes('appointments')) {
      return res.status(500).json({
        msg: 'Appointments table not found. Please run database migration.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }

    res.status(500).json({
      msg: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

const getPsychologistAppointments = async (req, res) => {
  try {
    if (req.user.role !== 'psychologist') {
      return res
        .status(403)
        .json({ msg: 'Only psychologists can view their appointments' });
    }

    const prisma = require('../config/database');
    const psychologist = await prisma.psychologists.findFirst({
      where: {
        userId: req.user.id,
      },
    });

    if (!psychologist) {
      return res.status(404).json({ msg: 'Psychologist profile not found' });
    }

    const result = await appointmentService.getPsychologistAppointments(
      psychologist.id
    );
    res.json(result);
  } catch (err) {
    console.error('Get psychologist appointments error:', err);

    if (err.message && err.message.includes('appointments')) {
      return res.status(500).json({
        msg: 'Appointments table not found. Please run database migration.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }

    res.status(500).json({
      msg: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

module.exports = {
  getAvailableSlots,
  createAppointment,
  getPatientAppointments,
  getPsychologistAppointments,
};
