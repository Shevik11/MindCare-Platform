// Test setup file
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
// Prisma uses DATABASE_URL instead of individual DB variables
process.env.DATABASE_URL =
  'postgresql://test_user:test_password@localhost:5432/test_db?schema=public';
// Keep old variables for backward compatibility if needed
process.env.DB_NAME = 'test_db';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_HOST = 'localhost';
