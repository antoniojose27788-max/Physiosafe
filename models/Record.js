const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Record = sequelize.define('Record', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  paciente_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  fisio_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  diagnostico: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tratamiento: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  evolucion: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'records',
  timestamps: true
});

module.exports = Record;
