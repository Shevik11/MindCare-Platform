const prisma = require('../config/database');

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

const getAvailableSlots = async psychologistId => {
  const psychologist = await prisma.psychologists.findFirst({
    where: {
      id: psychologistId,
      status: 'approved',
    },
  });

  if (!psychologist) {
    throw new Error('Psychologist not found');
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
  for (const slot of availableSlots) {
    const dateKey = new Date(slot).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    if (!slotsByDate[dateKey]) {
      slotsByDate[dateKey] = [];
    }
    slotsByDate[dateKey].push(slot.toISOString());
  }

  return {
    slots: availableSlots.map(slot => slot.toISOString()),
    slotsByDate,
  };
};

const createAppointment = async (
  psychologistId,
  patientId,
  appointmentDateTime
) => {
  const appointmentDate = new Date(appointmentDateTime);

  const psychologist = await prisma.psychologists.findFirst({
    where: {
      id: psychologistId,
      status: 'approved',
    },
    include: {
      Users: true,
    },
  });

  if (!psychologist) {
    throw new Error('Psychologist not found');
  }

  const existingAppointment = await prisma.appointments.findFirst({
    where: {
      psychologistId: psychologistId,
      appointmentDateTime: appointmentDate,
      status: {
        in: ['scheduled', 'completed'],
      },
    },
  });

  if (existingAppointment) {
    throw new Error('This time slot is already booked');
  }

  if (appointmentDate <= new Date()) {
    throw new Error('Appointment must be in the future');
  }

  const appointment = await prisma.appointments.create({
    data: {
      psychologistId: psychologistId,
      patientId: patientId,
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

  return {
    appointment,
    psychologist,
  };
};

const getPatientAppointments = async patientId => {
  const appointments = await prisma.appointments.findMany({
    where: {
      patientId: patientId,
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

  return {
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
  };
};

const getPsychologistAppointments = async psychologistId => {
  const appointments = await prisma.appointments.findMany({
    where: {
      psychologistId: psychologistId,
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
  for (const apt of appointments) {
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
  }

  return {
    appointments: appointments.map(apt => ({
      id: apt.id,
      appointmentDateTime: apt.appointmentDateTime,
      status: apt.status,
      patient: apt.Patient,
    })),
    appointmentsByDate,
  };
};

module.exports = {
  getAvailableSlots,
  createAppointment,
  getPatientAppointments,
  getPsychologistAppointments,
};
