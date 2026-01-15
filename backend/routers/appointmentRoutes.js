const express = require('express');
const router = express.Router();
const prisma = require('../db/db');
const auth = require('../middleware/auth');
const { sendAppointmentNotificationEmail } = require('../utils/email');

const generateAvailableSlots = () => {
  const slots = [];
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 30);

  const currentDate = new Date(now);
  currentDate.setHours(0, 0, 0, 0);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      for (let hour = 9; hour < 18; hour++) {
        const slot = new Date(currentDate);
        slot.setHours(hour, 0, 0, 0);

        const oneHourFromNow = new Date(now);
        oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
        if (slot >= oneHourFromNow) {
          slots.push(new Date(slot));
        }
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return slots;
};
router.get('/slots/:psychologistId', auth, async (req, res) => {
  try {
    const psychologistId = Number.parseInt(req.params.psychologistId, 10);

    const psychologist = await prisma.psychologists.findFirst({
      where: {
        id: psychologistId,
        status: 'approved',
      },
    });

    if (!psychologist) {
      return res.status(404).json({ msg: 'Psychologist not found' });
    }

    const existingAppointments = await prisma.appointments.findMany({
      where: {
        psychologistId: psychologistId,
        status: {
          in: ['scheduled', 'completed'],
        },
        appointmentDateTime: {
          gte: new Date(),
        },
      },
      select: {
        appointmentDateTime: true,
      },
    });

    const allSlots = generateAvailableSlots();

    const bookedTimes = new Set(
      existingAppointments.map(apt =>
        new Date(apt.appointmentDateTime).toISOString()
      )
    );

    const availableSlots = allSlots.filter(slot => {
      const slotTime = new Date(slot).toISOString();
      return !bookedTimes.has(slotTime);
    });

    const slotsByDate = {};
    availableSlots.forEach(slot => {
      const dateKey = new Date(slot).toLocaleDateString('uk-UA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      if (!slotsByDate[dateKey]) {
        slotsByDate[dateKey] = [];
      }
      slotsByDate[dateKey].push(slot.toISOString());
    });

    res.json({
      slots: availableSlots.map(slot => slot.toISOString()),
      slotsByDate,
    });
  } catch (err) {
    console.error('Get slots error:', err);
    res.status(500).json({
      msg: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});
router.post('/', auth, async (req, res) => {
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

    const appointmentDate = new Date(appointmentDateTime);

    const psychologist = await prisma.psychologists.findFirst({
      where: {
        id: parsedPsychologistId,
        status: 'approved',
      },
      include: {
        Users: true,
      },
    });

    if (!psychologist) {
      return res.status(404).json({ msg: 'Psychologist not found' });
    }

    const existingAppointment = await prisma.appointments.findFirst({
      where: {
        psychologistId: parsedPsychologistId,
        appointmentDateTime: appointmentDate,
        status: {
          in: ['scheduled', 'completed'],
        },
      },
    });

    if (existingAppointment) {
      return res.status(400).json({ msg: 'This time slot is already booked' });
    }

    if (appointmentDate <= new Date()) {
      return res.status(400).json({ msg: 'Appointment must be in the future' });
    }

    const appointment = await prisma.appointments.create({
      data: {
        psychologistId: parsedPsychologistId,
        patientId: req.user.id,
        appointmentDateTime: appointmentDate,
        status: 'scheduled',
      },
      include: {
        Psychologists: {
          include: {
            Users: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        Patient: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    try {
      await sendAppointmentNotificationEmail({
        psychologistEmail: psychologist.Users.email,
        psychologistName: `${psychologist.Users.firstName} ${psychologist.Users.lastName}`,
        patientName: `${req.user.firstName} ${req.user.lastName}`,
        appointmentDateTime: appointmentDate,
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
    res.status(500).json({
      msg: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});
router.get('/my', auth, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res
        .status(403)
        .json({ msg: 'Only patients can view their appointments' });
    }

    const appointments = await prisma.appointments.findMany({
      where: {
        patientId: req.user.id,
      },
      include: {
        Psychologists: {
          include: {
            Users: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                photoUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        appointmentDateTime: 'asc',
      },
    });

    const now = new Date();

    const active = appointments.filter(
      apt =>
        apt.Psychologists &&
        new Date(apt.appointmentDateTime) >= now &&
        apt.status === 'scheduled'
    );
    const archived = appointments.filter(
      apt =>
        apt.Psychologists &&
        (new Date(apt.appointmentDateTime) < now || apt.status !== 'scheduled')
    );

    res.json({
      active: active
        .filter(apt => apt.Psychologists)
        .map(apt => ({
          id: apt.id,
          appointmentDateTime: apt.appointmentDateTime,
          status: apt.status,
          psychologist: {
            id: apt.Psychologists.id,
            specialization: apt.Psychologists.specialization,
            price: apt.Psychologists.price
              ? Number.parseFloat(apt.Psychologists.price.toString())
              : null,
            user: apt.Psychologists.Users,
          },
        })),
      archived: archived
        .filter(apt => apt.Psychologists)
        .map(apt => ({
          id: apt.id,
          appointmentDateTime: apt.appointmentDateTime,
          status: apt.status,
          psychologist: {
            id: apt.Psychologists.id,
            specialization: apt.Psychologists.specialization,
            price: apt.Psychologists.price
              ? Number.parseFloat(apt.Psychologists.price.toString())
              : null,
            user: apt.Psychologists.Users,
          },
        })),
    });
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
});
router.get('/psychologist', auth, async (req, res) => {
  try {
    if (req.user.role !== 'psychologist') {
      return res
        .status(403)
        .json({ msg: 'Only psychologists can view their appointments' });
    }

    const psychologist = await prisma.psychologists.findFirst({
      where: {
        userId: req.user.id,
      },
    });

    if (!psychologist) {
      return res.status(404).json({ msg: 'Psychologist profile not found' });
    }

    const appointments = await prisma.appointments.findMany({
      where: {
        psychologistId: psychologist.id,
      },
      include: {
        Patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true,
          },
        },
      },
      orderBy: {
        appointmentDateTime: 'asc',
      },
    });

    const appointmentsByDate = {};
    appointments.forEach(apt => {
      const dateKey = new Date(apt.appointmentDateTime).toLocaleDateString(
        'uk-UA',
        {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }
      );
      if (!appointmentsByDate[dateKey]) {
        appointmentsByDate[dateKey] = [];
      }
      appointmentsByDate[dateKey].push({
        id: apt.id,
        appointmentDateTime: apt.appointmentDateTime,
        status: apt.status,
        patient: apt.Patient,
      });
    });

    res.json({
      appointments: appointments.map(apt => ({
        id: apt.id,
        appointmentDateTime: apt.appointmentDateTime,
        status: apt.status,
        patient: apt.Patient,
      })),
      appointmentsByDate,
    });
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
});

module.exports = router;
