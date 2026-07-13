const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

const Match = sequelize.define('Match', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  gameId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'ONGOING', 'FINISHED', 'CANCELLED'),
    defaultValue: 'PENDING'
  },
  players: {
    type: DataTypes.JSONB, // Contiene [{userId, team, username}]
    defaultValue: []
  },
  score: {
    type: DataTypes.JSONB,
    defaultValue: { teamA: 0, teamB: 0 }
  },
  events: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  startTime: {
    type: DataTypes.DATE
  },
  endTime: {
    type: DataTypes.DATE
  }
}, { timestamps: true });

module.exports = Match;