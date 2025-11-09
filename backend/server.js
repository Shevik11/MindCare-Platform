// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const prisma = require('./db/db');

const app = express();
app.use(cors());
app.use(express.json());

app.use(require('./middleware/formatDate'));

app.use('/api/auth', require('./routers/authRoutes'));
app.use('/api/psychologists', require('./routers/psychologistRoutes'));
app.use('/api/comments', require('./routers/commentRoutes'));
app.use('/api/articles', require('./routers/articleRoutes'));
app.use('/api/admin', require('./routers/adminRoutes'));
app.use('/api/appointments', require('./routers/appointmentRoutes'));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => res.send('API Running'));

const PORT = process.env.PORT || 5000;

// Connect to database and start server
async function startServer() {
  try {
    await prisma.$connect();
    console.log('PostgreSQL connected via Prisma.');
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  } catch (err) {
    console.error('Unable to connect to the database:', err);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
