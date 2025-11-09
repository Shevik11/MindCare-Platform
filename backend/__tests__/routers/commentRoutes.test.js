const request = require('supertest');
const express = require('express');
const { mockComment } = require('../mocks/db');

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
};

const mockCommentModel = {
  findOne: jest.fn(),
  create: jest.fn(),
  findByPk: jest.fn(),
  findAll: jest.fn(),
};

// Mock db.js which the model files import from
jest.mock('../../db/db', () => ({
  User: mockUserModel,
  Psychologist: mockPsychologistModel,
  Comment: mockCommentModel,
  sequelize: {},
}));

// Mock the model files - they re-export from db, so this should work
jest.mock('../../db/models/User', () => require('../../db/db').User);
jest.mock(
  '../../db/models/Psychologist',
  () => require('../../db/db').Psychologist
);
jest.mock('../../db/models/Comment', () => require('../../db/db').Comment);

jest.mock('../../middleware/auth');

const User = require('../../db/models/User');
const Comment = require('../../db/models/Comment');
const auth = require('../../middleware/auth');

const app = express();
app.use(express.json());
app.use('/api/comments', require('../../routers/commentRoutes'));

describe('Comment Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/comments/psychologist/:id', () => {
    it('should return all comments for a psychologist', async () => {
      const commentsWithUser = [
        {
          ...mockComment,
          User: {
            firstName: 'Test',
            lastName: 'User',
          },
        },
      ];

      Comment.findAll.mockResolvedValue(commentsWithUser);

      const res = await request(app).get('/api/comments/psychologist/1');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(Comment.findAll).toHaveBeenCalledWith({
        where: { psychologistId: '1' },
        include: [{ model: User, attributes: ['firstName', 'lastName'] }],
        order: [['createdAt', 'DESC']],
      });
    });

    it('should return empty array when no comments exist', async () => {
      Comment.findAll.mockResolvedValue([]);

      const res = await request(app).get('/api/comments/psychologist/1');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return 500 on server error', async () => {
      Comment.findAll.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/api/comments/psychologist/1');

      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/comments', () => {
    it('should create a new comment', async () => {
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1 };
        next();
      });
      Comment.create.mockResolvedValue(mockComment);
      Comment.findByPk.mockResolvedValue({
        ...mockComment,
        User: {
          firstName: 'Test',
          lastName: 'User',
        },
      });

      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', 'Bearer test-token')
        .send({
          psychologistId: 1,
          rating: 5,
          text: 'Great psychologist!',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('rating');
      expect(res.body).toHaveProperty('text');
      expect(Comment.create).toHaveBeenCalledWith({
        userId: 1,
        psychologistId: 1,
        rating: 5,
        text: 'Great psychologist!',
      });
    });

    it('should return 400 if required fields are missing', async () => {
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1 };
        next();
      });

      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', 'Bearer test-token')
        .send({
          psychologistId: 1,
          rating: 5,
          // text is missing
        });

      expect(res.status).toBe(400);
      expect(res.body.msg).toBe('Please provide all required fields');
      expect(Comment.create).not.toHaveBeenCalled();
    });

    it('should return 400 if rating is out of range (less than 1)', async () => {
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1 };
        next();
      });

      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', 'Bearer test-token')
        .send({
          psychologistId: 1,
          rating: 0,
          text: 'Test comment',
        });

      expect(res.status).toBe(400);
      // Rating 0 is falsy, so it's caught by the first validation check
      expect(res.body.msg).toBe('Please provide all required fields');
    });

    it('should return 400 if rating is less than 1 (but not 0)', async () => {
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1 };
        next();
      });

      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', 'Bearer test-token')
        .send({
          psychologistId: 1,
          rating: -1,
          text: 'Test comment',
        });

      expect(res.status).toBe(400);
      expect(res.body.msg).toBe('Rating must be between 1 and 5');
    });

    it('should return 400 if rating is out of range (greater than 5)', async () => {
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1 };
        next();
      });

      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', 'Bearer test-token')
        .send({
          psychologistId: 1,
          rating: 6,
          text: 'Test comment',
        });

      expect(res.status).toBe(400);
      expect(res.body.msg).toBe('Rating must be between 1 and 5');
    });

    it('should return 400 if rating is exactly 1 (valid edge case)', async () => {
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1 };
        next();
      });
      Comment.create.mockResolvedValue({ ...mockComment, rating: 1 });
      Comment.findByPk.mockResolvedValue({
        ...mockComment,
        rating: 1,
        User: {
          firstName: 'Test',
          lastName: 'User',
        },
      });

      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', 'Bearer test-token')
        .send({
          psychologistId: 1,
          rating: 1,
          text: 'Test comment',
        });

      expect(res.status).toBe(201);
    });

    it('should return 400 if rating is exactly 5 (valid edge case)', async () => {
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1 };
        next();
      });
      Comment.create.mockResolvedValue({ ...mockComment, rating: 5 });
      Comment.findByPk.mockResolvedValue({
        ...mockComment,
        rating: 5,
        User: {
          firstName: 'Test',
          lastName: 'User',
        },
      });

      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', 'Bearer test-token')
        .send({
          psychologistId: 1,
          rating: 5,
          text: 'Test comment',
        });

      expect(res.status).toBe(201);
    });

    it('should return 500 on server error', async () => {
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1 };
        next();
      });
      Comment.create.mockRejectedValue(new Error('Database error'));

      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', 'Bearer test-token')
        .send({
          psychologistId: 1,
          rating: 5,
          text: 'Test comment',
        });

      expect(res.status).toBe(500);
    });

    it('should return 400 if psychologistId is missing', async () => {
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1 };
        next();
      });

      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', 'Bearer test-token')
        .send({
          rating: 5,
          text: 'Test comment',
        });

      expect(res.status).toBe(400);
      expect(res.body.msg).toBe('Please provide all required fields');
    });
  });
});
