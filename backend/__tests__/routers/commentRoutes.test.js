const request = require('supertest');
const express = require('express');
const { mockComment } = require('../mocks/db');

// Create mock Prisma Client
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  psychologist: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  comment: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
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
          user: {
            firstName: 'Test',
            lastName: 'User',
          },
        },
      ];

      prisma.comment.findMany.mockResolvedValue(commentsWithUser);

      const res = await request(app).get('/api/comments/psychologist/1');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(prisma.comment.findMany).toHaveBeenCalledWith({
        where: { psychologistId: 1 },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should return empty array when no comments exist', async () => {
      prisma.comment.findMany.mockResolvedValue([]);

      const res = await request(app).get('/api/comments/psychologist/1');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return 500 on server error', async () => {
      prisma.comment.findMany.mockRejectedValue(new Error('Database error'));

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
      const commentWithUser = {
        ...mockComment,
        user: {
          firstName: 'Test',
          lastName: 'User',
        },
      };
      prisma.comment.create.mockResolvedValue(commentWithUser);

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
      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          psychologistId: 1,
          rating: 5,
          text: 'Great psychologist!',
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
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
      expect(prisma.comment.create).not.toHaveBeenCalled();
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
      const commentWithUser = {
        ...mockComment,
        rating: 1,
        user: {
          firstName: 'Test',
          lastName: 'User',
        },
      };
      prisma.comment.create.mockResolvedValue(commentWithUser);

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
      const commentWithUser = {
        ...mockComment,
        rating: 5,
        user: {
          firstName: 'Test',
          lastName: 'User',
        },
      };
      prisma.comment.create.mockResolvedValue(commentWithUser);

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
      prisma.comment.create.mockRejectedValue(new Error('Database error'));

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
