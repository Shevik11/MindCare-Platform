const { PrismaClient } = require('@prisma/client');

// Optimized Prisma Client configuration
const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Optimize for production
  ...(process.env.NODE_ENV === 'production' && {
    // Disable query logging in production for better performance
    log: ['error'],
  }),
});

// Handle Prisma connection errors gracefully
prisma.$on('error', e => {
  console.error('Prisma error:', e);
});

// Optimize connection management
if (process.env.NODE_ENV === 'production') {
  // Connection pooling is automatically handled by Prisma Client
  // The connection pool size is managed by the database URL connection string
}

module.exports = prisma;
module.exports.User = prisma.users;
module.exports.Psychologist = prisma.psychologists;
module.exports.Comment = prisma.comments;
module.exports.QualificationDocument = prisma.qualificationDocument;
module.exports.Appointment = prisma.appointments;
module.exports.Article = prisma.articles;
