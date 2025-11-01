// db/db.js
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false,
  }
);

// Define User model
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('patient', 'psychologist', 'admin'), defaultValue: 'patient' },
  firstName: { type: DataTypes.STRING },
  lastName: { type: DataTypes.STRING },
});

// Define Psychologist model
const Psychologist = sequelize.define('Psychologist', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  specialization: { type: DataTypes.STRING },
  experience: { type: DataTypes.INTEGER, defaultValue: 0 },
  bio: { type: DataTypes.TEXT },
  price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
});

const Comment = sequelize.define('Comment', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  rating: { type: DataTypes.INTEGER, allowNull: false },
  text: { type: DataTypes.TEXT, allowNull: false },
});


Psychologist.belongsTo(User, { foreignKey: 'userId', unique: true });
User.hasOne(Psychologist, { foreignKey: 'userId' });

Comment.belongsTo(Psychologist, { foreignKey: 'psychologistId' });
Comment.belongsTo(User, { foreignKey: 'userId' });

Psychologist.hasMany(Comment, { foreignKey: 'psychologistId' });
User.hasMany(Comment, { foreignKey: 'userId' });

module.exports = { sequelize, User, Psychologist, Comment };
