// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db/db');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const uploadQualification = upload.uploadQualification;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const {
    email,
    password,
    role,
    firstName,
    lastName,
    specialization,
    experience,
    bio,
    price,
  } = req.body;
  try {
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });
    if (existingUser)
      return res.status(400).json({ msg: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userRole = role || 'patient';

    const user = await prisma.users.create({
      data: {
        email,
        password: hashedPassword,
        role: userRole,
        firstName,
        lastName,
        ...(userRole === 'psychologist' && {
          Psychologists: {
            create: {
              specialization,
              experience: experience ? Number.parseInt(experience) : 0,
              bio,
              price: price ? Number.parseFloat(price) : 0,
              status: 'pending', // New psychologists need admin approval
              qualificationDocument: null, // Will be set when document is uploaded
            },
          },
        }),
      },
    });

    console.log('User created:', {
      id: user.id,
      role: user.role,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    const payload = {
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token, user: payload.user });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.users.findUnique({
      where: { email },
    });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token, user: payload.user });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update email notifications settings
router.put('/settings/email-notifications', auth, async (req, res) => {
  try {
    const { emailNotifications } = req.body;

    if (typeof emailNotifications !== 'boolean') {
      return res
        .status(400)
        .json({ error: 'emailNotifications must be a boolean' });
    }

    const updatedUser = await prisma.users.update({
      where: { id: req.user.id },
      data: { emailNotifications },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        photoUrl: true,
        emailNotifications: true,
      },
    });

    res.json(updatedUser);
  } catch (err) {
    console.error('Error updating email notifications settings:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
      include: {
        Psychologists: true,
      },
    });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    let userData = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      photoUrl: user.photoUrl,
      emailNotifications: user.emailNotifications ?? true,
    };

    if (user.Psychologists && user.Psychologists.length > 0) {
      const psychologist = user.Psychologists[0];
      userData.psychologist = {
        specialization: psychologist.specialization,
        experience: psychologist.experience,
        bio: psychologist.bio,
        // Convert Prisma Decimal to number for frontend
        price:
          psychologist.price != null
            ? Number.parseFloat(psychologist.price.toString())
            : null,
      };
    }

    res.json(userData);
  } catch (err) {
    console.error('Get me error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// POST /api/auth/register-psychologist - Register psychologist with qualification document
router.post(
  '/register-psychologist',
  uploadQualification.single('qualificationDocument'),
  async (req, res) => {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        specialization,
        experience,
        bio,
        price,
      } = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ msg: 'Missing required fields' });
      }

      // Qualification document is required for psychologists
      if (!req.file) {
        return res
          .status(400)
          .json({ msg: 'Qualification document is required' });
      }

      const existingUser = await prisma.users.findUnique({
        where: { email },
      });
      if (existingUser)
        return res.status(400).json({ msg: 'User already exists' });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const qualificationDocumentUrl = `/uploads/qualifications/${req.file.filename}`;

      const user = await prisma.users.create({
        data: {
          email,
          password: hashedPassword,
          role: 'psychologist',
          firstName,
          lastName,
          Psychologists: {
            create: {
              specialization,
              experience: experience ? Number.parseInt(experience) : 0,
              bio,
              price: price ? Number.parseFloat(price) : 0,
              status: 'pending', // Requires admin approval
              qualificationDocument: qualificationDocumentUrl,
            },
          },
        },
      });

      console.log('Psychologist registered (pending approval):', {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      });

      const payload = {
        user: {
          id: user.id,
          role: user.role,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      res.json({
        token,
        user: payload.user,
        message:
          'Реєстрацію успішно завершено. Ваш профіль очікує на підтвердження адміністратором.',
      });
    } catch (err) {
      console.error('Psychologist registration error:', err.message);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res
          .status(400)
          .json({ msg: 'File too large. Maximum size is 10MB' });
      }
      if (err.message.includes('Only PDF and image files')) {
        return res.status(400).json({
          msg: 'Only PDF and image files (JPEG, PNG, GIF) are allowed',
        });
      }
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

router.post('/upload-photo', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const photoUrl = `/uploads/photo/profilephoto/${req.file.filename}`;

    await prisma.users.update({
      where: { id: req.user.id },
      data: { photoUrl },
    });

    res.json({ photoUrl });
  } catch (err) {
    console.error('Upload photo error:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res
        .status(400)
        .json({ msg: 'File too large. Maximum size is 10MB' });
    }
    if (err.message === 'Only image files are allowed!') {
      return res.status(400).json({ msg: 'Only image files are allowed' });
    }
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
