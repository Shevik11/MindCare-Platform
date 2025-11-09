// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./db/db');

const app = express();
app.use(cors());
app.use(express.json());

app.use(require('./middleware/formatDate'));

app.use('/api/auth', require('./routers/authRoutes'));
app.use('/api/psychologists', require('./routers/psychologistRoutes'));
app.use('/api/comments', require('./routers/commentRoutes'));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => res.send('API Running'));

// app.use('/api/auth', require('./routes/authRoutes'));

const PORT = process.env.PORT || 5000;

sequelize
  .authenticate()
  .then(() => {
    console.log('PostgreSQL connected.');
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
