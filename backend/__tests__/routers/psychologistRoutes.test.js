const request = require('supertest');
const express = require('express');
const { mockPsychologist } = require('../mocks/db');

// Create mock models first
const mockUserModel = {
  findOne: jest.fn(),
  create: jest.fn(),
  findByPk: jest.fn(),
  update: jest.fn(),
};

const mockPsychologistModel = {
  findOne: jest.fn(),
  create: jest.fn(),
  findByPk: jest.fn(),
  update: jest.fn(),
  findAll: jest.fn(),
  findOrCreate: jest.fn(),
};

// Mock db.js which the model files import from
jest.mock('../../db/db', () => ({
  User: mockUserModel,
  Psychologist: mockPsychologistModel,
  Comment: {},
  sequelize: {},
}));

// Mock the model files - they re-export from db, so this should work
jest.mock('../../db/models/User', () => require('../../db/db').User);
jest.mock(
  '../../db/models/Psychologist',
  () => require('../../db/db').Psychologist
);

jest.mock('../../middleware/auth');

const User = require('../../db/models/User');
const Psychologist = require('../../db/models/Psychologist');
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
          User: {
            firstName: 'Test',
            lastName: 'Psychologist',
            email: 'psych@test.com',
            role: 'psychologist',
            photoUrl: null,
          },
        },
      ];

      Psychologist.findAll.mockResolvedValue(psychologistsWithUser);

      const res = await request(app).get('/api/psychologists');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(Psychologist.findAll).toHaveBeenCalledWith({
        include: [
          {
            model: User,
            attributes: ['firstName', 'lastName', 'email', 'role', 'photoUrl'],
          },
        ],
      });
    });

    it('should return empty array when no psychologists exist', async () => {
      Psychologist.findAll.mockResolvedValue([]);

      const res = await request(app).get('/api/psychologists');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return 500 on server error', async () => {
      Psychologist.findAll.mockRejectedValue(new Error('Database error'));

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
        User: userData,
        toJSON: function () {
          return {
            id: this.id,
            userId: this.userId,
            specialization: this.specialization,
            experience: this.experience,
            bio: this.bio,
            price: this.price,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            User: this.User,
          };
        },
      };

      Psychologist.findByPk.mockResolvedValue(psychologistWithUser);

      const res = await request(app).get('/api/psychologists/1');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body.id).toBe(mockPsychologist.id);
      expect(res.body).toHaveProperty('specialization');
      expect(res.body.specialization).toBe(mockPsychologist.specialization);
      // Verify that findByPk was called with correct parameters including User model
      expect(Psychologist.findByPk).toHaveBeenCalledWith('1', {
        include: [
          {
            model: User,
            attributes: ['firstName', 'lastName', 'email', 'role', 'photoUrl'],
          },
        ],
      });
    });

    it('should return 404 if psychologist not found', async () => {
      Psychologist.findByPk.mockResolvedValue(null);

      const res = await request(app).get('/api/psychologists/999');

      expect(res.status).toBe(404);
      expect(res.body.msg).toBe('Psychologist not found');
    });

    it('should return 500 on server error', async () => {
      Psychologist.findByPk.mockRejectedValue(new Error('Database error'));

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
      User.update.mockResolvedValue([1]);

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
      expect(User.update).toHaveBeenCalled();
      expect(Psychologist.findOrCreate).not.toHaveBeenCalled();
    });

    it('should update psychologist profile for psychologist user', async () => {
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'psychologist' };
        next();
      });
      User.update.mockResolvedValue([1]);
      Psychologist.findOrCreate.mockResolvedValue([mockPsychologist, false]);
      Psychologist.update.mockResolvedValue([1]);

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
      expect(User.update).toHaveBeenCalled();
      expect(Psychologist.findOrCreate).toHaveBeenCalled();
    });

    it('should create psychologist profile if it does not exist', async () => {
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'psychologist' };
        next();
      });
      User.update.mockResolvedValue([1]);
      Psychologist.findOrCreate.mockResolvedValue([mockPsychologist, true]);

      const res = await request(app)
        .put('/api/psychologists/profile')
        .set('Authorization', 'Bearer test-token')
        .send({
          specialization: 'New Specialization',
          experience: 10,
        });

      expect(res.status).toBe(200);
      expect(res.body.msg).toBe('Profile updated');
      expect(Psychologist.update).not.toHaveBeenCalled();
    });

    it('should only update user fields for non-psychologist users', async () => {
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'patient' };
        next();
      });
      User.update.mockResolvedValue([1]);

      const res = await request(app)
        .put('/api/psychologists/profile')
        .set('Authorization', 'Bearer test-token')
        .send({
          firstName: 'Updated',
          specialization: 'Should be ignored',
          experience: 10,
        });

      expect(res.status).toBe(200);
      expect(User.update).toHaveBeenCalledWith(
        { firstName: 'Updated' },
        { where: { id: 1 } }
      );
      expect(Psychologist.findOrCreate).not.toHaveBeenCalled();
    });

    it('should return 500 on server error', async () => {
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'patient' };
        next();
      });
      User.update.mockRejectedValue(new Error('Database error'));

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
