const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  avatar: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  role: {
    type: DataTypes.ENUM('PLAYER', 'LOCATION_ADMIN', 'GAME_ADMIN', 'PLATFORM_ADMIN'),
    allowNull: false,
    defaultValue: 'PLAYER',
    validate: {
      isIn: {
        args: [['PLAYER', 'LOCATION_ADMIN', 'GAME_ADMIN', 'PLATFORM_ADMIN']],
        msg: 'Ruolo utente non valido.'
      }
    }
  },
  totalWins: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  matchesPlayed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};
module.exports = User;