const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

const Tournament = sequelize.define('Tournament', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT
  },
  gameType: {
    type: DataTypes.ENUM('FOOSBALL', 'DARTS', 'PINGPONG', 'AIRHOCKEY'),
    allowNull: false
  },
  locationId: {
    type: DataTypes.UUID
  },
  status: {
    type: DataTypes.ENUM('REGISTRATION_OPEN', 'ONGOING', 'FINISHED', 'CANCELLED'),
    defaultValue: 'REGISTRATION_OPEN'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE
  },
  maxParticipants: {
    type: DataTypes.INTEGER,
    defaultValue: 16
  },
  participants: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  matches: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  leaderboard: {
    type: DataTypes.JSONB,
    defaultValue: []
  }
}, { timestamps: true });

module.exports = Tournament;