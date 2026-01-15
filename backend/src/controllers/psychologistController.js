const prisma = require('../config/database');

const getAllPsychologists = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [psychologists, total] = await Promise.all([
      prisma.psychologists.findMany({
        where: {
          status: 'approved',
        },
        include: {
          Users: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              photoUrl: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.psychologists.count({
        where: {
          status: 'approved',
        },
      }),
    ]);

    const mappedPsychologists = psychologists.map(p => {
      const { Users, price, ...rest } = p;
      return {
        ...rest,
        User: Users || null,
        price: price != null ? parseFloat(price.toString()) : null,
      };
    });

    res.json({
      psychologists: mappedPsychologists,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Error getting psychologists:', err);
    res.status(500).json({
      error: 'Server Error',
      message: err.message,
      code: err.code,
    });
  }
};

const getPsychologistById = async (req, res) => {
  try {
    const psychologist = await prisma.psychologists.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        Users: {
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
    const { Users, price, ...rest } = psychologist;
    const mappedPsychologist = {
      ...rest,
      User: Users || null,
      price: price != null ? parseFloat(price.toString()) : null,
    };
    res.json(mappedPsychologist);
  } catch (err) {
    console.error('Error getting psychologist:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

const updateProfile = async (req, res) => {
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
      await prisma.users.update({
        where: { id: req.user.id },
        data: userData,
      });
    }

    if (
      req.user.role === 'psychologist' &&
      Object.keys(psychologistData).length > 0
    ) {
      const existingPsychologist = await prisma.psychologists.findFirst({
        where: { userId: req.user.id },
        select: { id: true },
      });

      if (existingPsychologist) {
        await prisma.psychologists.update({
          where: { id: existingPsychologist.id },
          data: psychologistData,
        });
      } else {
        await prisma.psychologists.create({
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
    res.status(500).json({ msg: 'Server Error' });
  }
};

module.exports = {
  getAllPsychologists,
  getPsychologistById,
  updateProfile,
};
