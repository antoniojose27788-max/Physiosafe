// models/Record.js
// Expediente clínico: evolución, diagnóstico y tratamientos por paciente

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Record = sequelize.define('Record', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  diagnostico: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tratamientos: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  evolucion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  paciente_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  fisio_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  }
}, {
  tableName: 'records',
  timestamps: true
});

module.exports = Record;
