const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Bill = sequelize.define('Bill', {
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
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  fecha_emision: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'pagado'),
    defaultValue: 'pendiente'
  }
}, {
  tableName: 'bills',
  timestamps: true
});

module.exports = Bill;
