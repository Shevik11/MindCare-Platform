const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { mockUser, mockPsychologist } = require('../mocks/db');

// Create mock Prisma Client
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  psychologist: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

// Mock db.js which exports Prisma Client
jest.mock('../../db/db', () => mockPrisma);

jest.mock('../../middleware/auth');
const mockSingleMiddleware = jest.fn((req, res, next) => {
  // Default: no file
  req.file = null;
  next();
});

jest.mock('../../middleware/upload', () => {
  const mockSingle = jest.fn(_fieldName => {
    return mockSingleMiddleware;
  });
  return {
    single: mockSingle,
  };
});
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const prisma = require('../../db/db');
const auth = require('../../middleware/auth');

const app = express();
app.use(express.json());
app.use('/api/auth', require('../../routers/authRoutes'));

// Add error handler middleware for multer errors (must be after routes)
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ msg: 'File too large. Maximum size is 5MB' });
  }
  // For other errors, let the route handler handle them
  next(err);
});

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset upload middleware mock
    mockSingleMiddleware.mockImplementation((req, res, next) => {
      req.file = null;
      next();
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new patient user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      jwt.sign.mockReturnValue('test-token');

      const res = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
        role: 'patient',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.user.role).toBe('patient');
      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.psychologist.create).not.toHaveBeenCalled();
    });

    it('should register a new psychologist user with psychologist profile', async () => {
      const psychologistUser = { ...mockUser, role: 'psychologist' };
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(psychologistUser);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      jwt.sign.mockReturnValue('test-token');

      const res = await request(app).post('/api/auth/register').send({
        email: 'psych@example.com',
        password: 'password123',
        role: 'psychologist',
        firstName: 'Psych',
        lastName: 'Logist',
        specialization: 'Clinical Psychology',
        experience: 5,
        bio: 'Test bio',
        price: 100,
      });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('psychologist');
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: 'psychologist',
            psychologist: expect.objectContaining({
              create: expect.objectContaining({
                specialization: 'Clinical Psychology',
                experience: 5,
              }),
            }),
          }),
        })
      );
    });

    it('should return 400 if user already exists', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(400);
      expect(res.body.msg).toBe('User already exists');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should return 500 on server error', async () => {
      prisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const res = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(500);
    });

    it('should use default role "patient" when role is not provided', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      jwt.sign.mockReturnValue('test-token');

      const res = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: 'patient',
          }),
        })
      );
    });

    it('should handle psychologist registration with default experience and price', async () => {
      const psychologistUser = { ...mockUser, role: 'psychologist' };
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(psychologistUser);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      jwt.sign.mockReturnValue('test-token');

      const res = await request(app).post('/api/auth/register').send({
        email: 'psych@example.com',
        password: 'password123',
        role: 'psychologist',
        specialization: 'Test Specialization',
        // experience and price not provided
      });

      expect(res.status).toBe(200);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: 'psychologist',
            psychologist: expect.objectContaining({
              create: expect.objectContaining({
                experience: 0,
                price: 0,
              }),
            }),
          }),
        })
      );
    });

    it('should parse experience and price as numbers for psychologist', async () => {
      const psychologistUser = { ...mockUser, role: 'psychologist' };
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(psychologistUser);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      jwt.sign.mockReturnValue('test-token');

      const res = await request(app).post('/api/auth/register').send({
        email: 'psych@example.com',
        password: 'password123',
        role: 'psychologist',
        specialization: 'Test',
        experience: '10', // string
        price: '150.50', // string
      });

      expect(res.status).toBe(200);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            psychologist: expect.objectContaining({
              create: expect.objectContaining({
                experience: 10,
                price: 150.5,
              }),
            }),
          }),
        })
      );
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user with valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('test-token');

      const res = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        mockUser.password
      );
    });

    it('should return 400 if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(400);
      expect(res.body.msg).toBe('Invalid credentials');
    });

    it('should return 400 if password is incorrect', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      const res = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(400);
      expect(res.body.msg).toBe('Invalid credentials');
    });

    it('should return 500 on server error', async () => {
      prisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const res = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(500);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user data for authenticated user', async () => {
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'patient' };
        next();
      });
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('email');
      expect(res.body).toHaveProperty('role');
    });

    it('should return psychologist data when user is psychologist', async () => {
      const psychologistUser = {
        ...mockUser,
        role: 'psychologist',
        psychologist: mockPsychologist,
      };
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'psychologist' };
        next();
      });
      prisma.user.findUnique.mockResolvedValue(psychologistUser);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('psychologist');
      expect(res.body.psychologist).toHaveProperty('specialization');
    });

    it('should return 404 if user not found', async () => {
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 999 };
        next();
      });
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(404);
      expect(res.body.msg).toBe('User not found');
    });

    it('should return 500 on server error', async () => {
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1 };
        next();
      });
      prisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(500);
    });

    it('should return user data without psychologist profile if psychologist profile does not exist', async () => {
      const psychologistUser = { ...mockUser, role: 'psychologist' };
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'psychologist' };
        next();
      });
      prisma.user.findUnique.mockResolvedValue(psychologistUser);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('role', 'psychologist');
      expect(res.body).not.toHaveProperty('psychologist');
    });

    it('should return user data with all user fields', async () => {
      const userWithPhoto = { ...mockUser, photoUrl: '/uploads/photo.jpg' };
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'patient' };
        next();
      });
      prisma.user.findUnique.mockResolvedValue(userWithPhoto);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('email');
      expect(res.body).toHaveProperty('role');
      expect(res.body).toHaveProperty('firstName');
      expect(res.body).toHaveProperty('lastName');
      expect(res.body).toHaveProperty('photoUrl');
    });
  });

  describe('POST /api/auth/upload-photo', () => {
    beforeEach(() => {
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1 };
        next();
      });
    });

    it('should upload photo for authenticated user', async () => {
      // Mock middleware to set req.file
      mockSingleMiddleware.mockImplementation((req, res, next) => {
        req.file = {
          filename: 'test-photo.jpg',
          originalname: 'photo.jpg',
        };
        next();
      });

      prisma.user.update.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/upload-photo')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('photoUrl');
      expect(res.body.photoUrl).toBe(
        '/uploads/photo/profilephoto/test-photo.jpg'
      );
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { photoUrl: '/uploads/photo/profilephoto/test-photo.jpg' },
      });
    });

    it('should return 400 if no file uploaded', async () => {
      // Mock middleware to not set req.file (default behavior)
      mockSingleMiddleware.mockImplementation((req, res, next) => {
        req.file = null;
        next();
      });

      const res = await request(app)
        .post('/api/auth/upload-photo')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(400);
      expect(res.body.msg).toBe('No file uploaded');
    });

    it('should return 400 if file is too large', async () => {
      // Multer errors are handled by Express error handler middleware
      mockSingleMiddleware.mockImplementation((req, res, next) => {
        const err = new Error('File too large');
        err.code = 'LIMIT_FILE_SIZE';
        next(err);
      });

      const res = await request(app)
        .post('/api/auth/upload-photo')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(400);
      expect(res.body.msg).toBe('File too large. Maximum size is 5MB');
    });

    it('should return 500 on server error', async () => {
      mockSingleMiddleware.mockImplementation((req, res, next) => {
        req.file = {
          filename: 'test-photo.jpg',
          originalname: 'photo.jpg',
        };
        next();
      });

      prisma.user.update.mockRejectedValue(new Error('Database error'));

      const res = await request(app)
        .post('/api/auth/upload-photo')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(500);
      expect(res.body.msg).toBe('Server Error');
    });

    it('should return 500 on general server error during upload', async () => {
      mockSingleMiddleware.mockImplementation((req, res, next) => {
        req.file = {
          filename: 'test-photo.jpg',
          originalname: 'photo.jpg',
        };
        next();
      });

      prisma.user.update.mockRejectedValue(new Error('General error'));

      const res = await request(app)
        .post('/api/auth/upload-photo')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(500);
      expect(res.body.msg).toBe('Server Error');
    });
  });
});
