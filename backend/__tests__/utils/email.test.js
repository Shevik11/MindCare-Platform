// Test email utils
// Mock dependencies before requiring modules
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(),
}));

jest.mock('../../db/db', () => {
  const mockPrisma = {
    users: {
      findMany: jest.fn(),
    },
  };
  return mockPrisma;
});

// Save original env
const originalEnv = { ...process.env };

describe('email utils', () => {
  let emailUtils;
  let nodemailer;
  let prisma;
  let mockTransporter;
  let sendMailMock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset environment variables
    process.env = { ...originalEnv };

    // Re-require modules to get fresh instances
    nodemailer = require('nodemailer');
    prisma = require('../../db/db');

    // Create mock transporter
    sendMailMock = jest
      .fn()
      .mockResolvedValue({ messageId: 'test-message-id' });
    mockTransporter = {
      sendMail: sendMailMock,
    };

    nodemailer.createTransporter.mockReturnValue(mockTransporter);

    // Re-require email utils after setting up mocks
    delete require.cache[require.resolve('../../utils/email')];
    emailUtils = require('../../utils/email');
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('sendArticleNotification', () => {
    beforeEach(() => {
      process.env.EMAIL_HOST = 'smtp.example.com';
      process.env.EMAIL_USER = 'test@example.com';
      process.env.EMAIL_PASS = 'password123';
      process.env.EMAIL_FROM = 'noreply@example.com';
      process.env.FRONTEND_URL = 'http://localhost:5173';

      delete require.cache[require.resolve('../../utils/email')];
      emailUtils = require('../../utils/email');
    });

    it('should send article notification email successfully', async () => {
      const recipientEmail = 'user@test.com';
      const recipientName = 'Test User';
      const article = {
        id: 1,
        title: 'Test Article',
        description: 'Test Description',
      };

      const result = await emailUtils.sendArticleNotification(
        recipientEmail,
        recipientName,
        article
      );

      expect(result).toBe(true);
      expect(nodemailer.createTransporter).toHaveBeenCalled();
      expect(sendMailMock).toHaveBeenCalledTimes(1);

      const mailOptions = sendMailMock.mock.calls[0][0];
      expect(mailOptions.to).toBe(recipientEmail);
      expect(mailOptions.subject).toContain(article.title);
      expect(mailOptions.html).toContain(article.title);
      expect(mailOptions.html).toContain(article.description);
      expect(mailOptions.text).toContain(article.title);
    });

    it('should use default recipient name when name is not provided', async () => {
      const recipientEmail = 'user@test.com';
      const article = {
        id: 1,
        title: 'Test Article',
      };

      await emailUtils.sendArticleNotification(recipientEmail, null, article);

      const mailOptions = sendMailMock.mock.calls[0][0];
      expect(mailOptions.html).toContain('користувач');
      expect(mailOptions.text).toContain('користувач');
    });

    it('should handle missing article description', async () => {
      const recipientEmail = 'user@test.com';
      const recipientName = 'Test User';
      const article = {
        id: 1,
        title: 'Test Article',
      };

      await emailUtils.sendArticleNotification(
        recipientEmail,
        recipientName,
        article
      );

      const mailOptions = sendMailMock.mock.calls[0][0];
      expect(mailOptions.html).toContain(article.title);
      expect(mailOptions.text).toContain(article.title);
    });

    it('should return false when email configuration is missing', async () => {
      delete process.env.EMAIL_HOST;
      delete process.env.EMAIL_USER;
      delete process.env.EMAIL_PASS;

      delete require.cache[require.resolve('../../utils/email')];
      emailUtils = require('../../utils/email');

      const recipientEmail = 'user@test.com';
      const recipientName = 'Test User';
      const article = {
        id: 1,
        title: 'Test Article',
      };

      const result = await emailUtils.sendArticleNotification(
        recipientEmail,
        recipientName,
        article
      );

      expect(result).toBe(false);
      expect(sendMailMock).not.toHaveBeenCalled();
    });

    it('should handle email sending errors gracefully', async () => {
      sendMailMock.mockRejectedValue(new Error('SMTP error'));

      const recipientEmail = 'user@test.com';
      const recipientName = 'Test User';
      const article = {
        id: 1,
        title: 'Test Article',
      };

      const result = await emailUtils.sendArticleNotification(
        recipientEmail,
        recipientName,
        article
      );

      expect(result).toBe(false);
    });

    it('should use FRONTEND_URL from environment for article URL', async () => {
      process.env.FRONTEND_URL = 'https://example.com';

      delete require.cache[require.resolve('../../utils/email')];
      emailUtils = require('../../utils/email');

      const recipientEmail = 'user@test.com';
      const recipientName = 'Test User';
      const article = {
        id: 1,
        title: 'Test Article',
      };

      await emailUtils.sendArticleNotification(
        recipientEmail,
        recipientName,
        article
      );

      const mailOptions = sendMailMock.mock.calls[0][0];
      expect(mailOptions.html).toContain('https://example.com/article/1');
      expect(mailOptions.text).toContain('https://example.com/article/1');
    });
  });

  describe('notifyUsersAboutArticle', () => {
    beforeEach(() => {
      process.env.EMAIL_HOST = 'smtp.example.com';
      process.env.EMAIL_USER = 'test@example.com';
      process.env.EMAIL_PASS = 'password123';
      process.env.FRONTEND_URL = 'http://localhost:5173';

      delete require.cache[require.resolve('../../utils/email')];
      emailUtils = require('../../utils/email');
    });

    it('should notify all users with email notifications enabled', async () => {
      const users = [
        {
          id: 1,
          email: 'user1@test.com',
          firstName: 'User',
          lastName: 'One',
        },
        {
          id: 2,
          email: 'user2@test.com',
          firstName: 'User',
          lastName: 'Two',
        },
      ];

      const article = {
        id: 1,
        title: 'Test Article',
        description: 'Test Description',
      };

      prisma.users.findMany.mockResolvedValue(users);

      const result = await emailUtils.notifyUsersAboutArticle(article);

      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.total).toBe(2);
      expect(prisma.users.findMany).toHaveBeenCalledWith({
        where: {
          emailNotifications: true,
          role: {
            not: 'admin',
          },
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });
      expect(sendMailMock).toHaveBeenCalledTimes(2);
    });

    it('should use email as recipient name when firstName/lastName are missing', async () => {
      const users = [
        {
          id: 1,
          email: 'user1@test.com',
          firstName: null,
          lastName: null,
        },
      ];

      const article = {
        id: 1,
        title: 'Test Article',
      };

      prisma.users.findMany.mockResolvedValue(users);

      await emailUtils.notifyUsersAboutArticle(article);

      expect(sendMailMock).toHaveBeenCalledTimes(1);
      const mailOptions = sendMailMock.mock.calls[0][0];
      expect(mailOptions.to).toBe('user1@test.com');
      // Should use email as recipient name when firstName/lastName are missing
      expect(mailOptions.html).toContain('user1@test.com');
      expect(mailOptions.text).toContain('user1@test.com');
    });

    it('should handle email sending failures gracefully', async () => {
      const users = [
        {
          id: 1,
          email: 'user1@test.com',
          firstName: 'User',
          lastName: 'One',
        },
        {
          id: 2,
          email: 'user2@test.com',
          firstName: 'User',
          lastName: 'Two',
        },
      ];

      const article = {
        id: 1,
        title: 'Test Article',
      };

      prisma.users.findMany.mockResolvedValue(users);
      // First call succeeds, second call fails
      sendMailMock
        .mockResolvedValueOnce({ messageId: 'test-1' })
        .mockRejectedValueOnce(new Error('SMTP error'));

      const result = await emailUtils.notifyUsersAboutArticle(article);

      // One should succeed, one should fail
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.total).toBe(2);
      expect(sendMailMock).toHaveBeenCalledTimes(2);
    });

    it('should return empty result when database query fails', async () => {
      const article = {
        id: 1,
        title: 'Test Article',
      };

      prisma.users.findMany.mockRejectedValue(new Error('Database error'));

      const result = await emailUtils.notifyUsersAboutArticle(article);

      expect(result.successful).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.total).toBe(0);
      expect(result.error).toBe('Database error');
    });

    it('should not notify admin users', async () => {
      const users = [
        {
          id: 1,
          email: 'admin@test.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
        },
        {
          id: 2,
          email: 'user@test.com',
          firstName: 'Regular',
          lastName: 'User',
          role: 'patient',
        },
      ];

      const article = {
        id: 1,
        title: 'Test Article',
      };

      // Mock to return only non-admin user (simulating the where clause filter)
      prisma.users.findMany.mockResolvedValue([users[1]]);

      const result = await emailUtils.notifyUsersAboutArticle(article);

      expect(result.total).toBe(1);
      expect(sendMailMock).toHaveBeenCalledTimes(1);
      const mailOptions = sendMailMock.mock.calls[0][0];
      expect(mailOptions.to).toBe('user@test.com');
    });
  });
});
