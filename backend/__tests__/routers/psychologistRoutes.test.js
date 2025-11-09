const request = require('supertest');
const express = require('express');
const { mockPsychologist } = require('../mocks/db');

// Create mock Prisma Client
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  psychologist: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

// Mock db.js which exports Prisma Client
jest.mock('../../db/db', () => mockPrisma);

jest.mock('../../middleware/auth');

const prisma = require('../../db/db');
const auth = require('../../middleware/auth');

const app = express();
app.use(express.json());
app.use('/api/psychologists', require('../../routers/psychologistRoutes'));

describe('Psychologist Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/psychologists', () => {
    it('should return all psychologists', async () => {
      const psychologistsWithUser = [
        {
          ...mockPsychologist,
          user: {
            firstName: 'Test',
            lastName: 'Psychologist',
            email: 'psych@test.com',
            role: 'psychologist',
            photoUrl: null,
          },
        },
      ];

      prisma.psychologist.findMany.mockResolvedValue(psychologistsWithUser);

      const res = await request(app).get('/api/psychologists');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(prisma.psychologist.findMany).toHaveBeenCalledWith({
        include: {
          user: {
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
    });

    it('should return empty array when no psychologists exist', async () => {
      prisma.psychologist.findMany.mockResolvedValue([]);

      const res = await request(app).get('/api/psychologists');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return 500 on server error', async () => {
      prisma.psychologist.findMany.mockRejectedValue(
        new Error('Database error')
      );

      const res = await request(app).get('/api/psychologists');

      expect(res.status).toBe(500);
    });
  });

  describe('GET /api/psychologists/:id', () => {
    it('should return psychologist by id', async () => {
      const userData = {
        firstName: 'Test',
        lastName: 'Psychologist',
        email: 'psych@test.com',
        role: 'psychologist',
        photoUrl: null,
      };

      const psychologistWithUser = {
        id: mockPsychologist.id,
        userId: mockPsychologist.userId,
        specialization: mockPsychologist.specialization,
        experience: mockPsychologist.experience,
        bio: mockPsychologist.bio,
        price: mockPsychologist.price,
        createdAt: mockPsychologist.createdAt,
        updatedAt: mockPsychologist.updatedAt,
        user: userData,
      };

      prisma.psychologist.findUnique.mockResolvedValue(psychologistWithUser);

      const res = await request(app).get('/api/psychologists/1');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body.id).toBe(mockPsychologist.id);
      expect(res.body).toHaveProperty('specialization');
      expect(res.body.specialization).toBe(mockPsychologist.specialization);
      expect(prisma.psychologist.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          user: {
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
    });

    it('should return 404 if psychologist not found', async () => {
      prisma.psychologist.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/api/psychologists/999');

      expect(res.status).toBe(404);
      expect(res.body.msg).toBe('Psychologist not found');
    });

    it('should return 500 on server error', async () => {
      prisma.psychologist.findUnique.mockRejectedValue(
        new Error('Database error')
      );

      const res = await request(app).get('/api/psychologists/1');

      expect(res.status).toBe(500);
    });
  });

  describe('PUT /api/psychologists/profile', () => {
    it('should update user profile for patient', async () => {
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'patient' };
        next();
      });
      prisma.user.update.mockResolvedValue(mockPsychologist);

      const res = await request(app)
        .put('/api/psychologists/profile')
        .set('Authorization', 'Bearer test-token')
        .send({
          firstName: 'Updated',
          lastName: 'Name',
          email: 'updated@test.com',
        });

      expect(res.status).toBe(200);
      expect(res.body.msg).toBe('Profile updated');
      expect(prisma.user.update).toHaveBeenCalled();
      expect(prisma.psychologist.findUnique).not.toHaveBeenCalled();
    });

    it('should update psychologist profile for psychologist user', async () => {
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'psychologist' };
        next();
      });
      prisma.user.update.mockResolvedValue(mockPsychologist);
      prisma.psychologist.findUnique.mockResolvedValue(mockPsychologist);
      prisma.psychologist.update.mockResolvedValue(mockPsychologist);

      const res = await request(app)
        .put('/api/psychologists/profile')
        .set('Authorization', 'Bearer test-token')
        .send({
          firstName: 'Updated',
          specialization: 'New Specialization',
          experience: 10,
          bio: 'Updated bio',
          price: 200,
        });

      expect(res.status).toBe(200);
      expect(res.body.msg).toBe('Profile updated');
      expect(prisma.user.update).toHaveBeenCalled();
      expect(prisma.psychologist.findUnique).toHaveBeenCalled();
    });

    it('should create psychologist profile if it does not exist', async () => {
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'psychologist' };
        next();
      });
      prisma.user.update.mockResolvedValue(mockPsychologist);
      prisma.psychologist.findUnique.mockResolvedValue(null);
      prisma.psychologist.create.mockResolvedValue(mockPsychologist);

      const res = await request(app)
        .put('/api/psychologists/profile')
        .set('Authorization', 'Bearer test-token')
        .send({
          specialization: 'New Specialization',
          experience: 10,
        });

      expect(res.status).toBe(200);
      expect(res.body.msg).toBe('Profile updated');
      expect(prisma.psychologist.update).not.toHaveBeenCalled();
      expect(prisma.psychologist.create).toHaveBeenCalled();
    });

    it('should only update user fields for non-psychologist users', async () => {
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'patient' };
        next();
      });
      prisma.user.update.mockResolvedValue(mockPsychologist);

      const res = await request(app)
        .put('/api/psychologists/profile')
        .set('Authorization', 'Bearer test-token')
        .send({
          firstName: 'Updated',
          specialization: 'Should be ignored',
          experience: 10,
        });

      expect(res.status).toBe(200);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { firstName: 'Updated' },
      });
      expect(prisma.psychologist.findUnique).not.toHaveBeenCalled();
    });

    it('should return 500 on server error', async () => {
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'patient' };
        next();
      });
      prisma.user.update.mockRejectedValue(new Error('Database error'));

      const res = await request(app)
        .put('/api/psychologists/profile')
        .set('Authorization', 'Bearer test-token')
        .send({
          firstName: 'Updated',
        });

      expect(res.status).toBe(500);
    });

    it('should handle empty request body', async () => {
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'patient' };
        next();
      });

      const res = await request(app)
        .put('/api/psychologists/profile')
        .set('Authorization', 'Bearer test-token')
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.msg).toBe('Profile updated');
    });
  });
});
