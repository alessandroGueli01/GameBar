const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');
const Location = require('./Location');

const Game = sequelize.define('Game', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  gameType: {
    type: DataTypes.ENUM('FOOSBALL', 'DARTS', 'PINGPONG', 'AIRHOCKEY'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('ONLINE', 'OFFLINE', 'MAINTENANCE'),
    defaultValue: 'OFFLINE'
  },
  sensors: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, { timestamps: true });

Game.belongsTo(Location, { foreignKey: 'locationId', as: 'location' });
Location.hasMany(Game, { foreignKey: 'locationId' });

module.exports = Game;