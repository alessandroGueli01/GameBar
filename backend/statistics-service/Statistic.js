const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

const Statistic = sequelize.define('Statistic', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  wins: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  losses: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  draws: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  matchesPlayed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, { timestamps: true });

module.exports = Statistic;