// db/db.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
});

// Export Prisma client as default
module.exports = prisma;

// Export models with singular names for convenience
module.exports.User = prisma.users;
module.exports.Psychologist = prisma.psychologists;
module.exports.Comment = prisma.comments;
module.exports.QualificationDocument = prisma.qualificationDocument;
module.exports.Appointment = prisma.appointments;
