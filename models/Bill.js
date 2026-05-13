// models/Bill.js
// Facturas asociadas a pacientes

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Bill = sequelize.define('Bill', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  numero_factura: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true
  },
  monto: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  concepto: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  estado: {
    type: DataTypes.ENUM('emitida', 'pagada', 'anulada'),
    allowNull: false,
    defaultValue: 'emitida'
  },
  paciente_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  creado_por_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  }
}, {
  tableName: 'bills',
  timestamps: true
});

module.exports = Bill;
