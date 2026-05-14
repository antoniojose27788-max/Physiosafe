// models/Appointment.js
// Definición del modelo Appointment para Sequelize

// Importamos DataTypes de Sequelize para definir tipos de datos
const { DataTypes } = require('sequelize');

// Importamos la instancia de Sequelize desde la configuración de la base de datos
const { sequelize } = require('../config/db');

// Definimos el modelo Appointment
const Appointment = sequelize.define('Appointment', {
  // Campo id: UUID único generado automáticamente
  id: {
    type: DataTypes.UUID, // Tipo UUID
    defaultValue: DataTypes.UUIDV4, // Valor por defecto generado automáticamente
    primaryKey: true, // Es la clave primaria
    allowNull: false // No puede ser nulo
  },
  // Campo fecha_hora: fecha y hora de la cita
  fecha_hora: {
    type: DataTypes.DATE, // Tipo fecha
    allowNull: false // Obligatorio
  },
  // Campo estado: enumeración con valores fijos para el estado de la cita
  estado: {
    type: DataTypes.ENUM('pendiente', 'completada'), // Valores permitidos
    allowNull: false, // Obligatorio
    defaultValue: 'pendiente' // Valor por defecto
  },
  // Campo paciente_id: clave foránea que referencia al usuario paciente
  paciente_id: {
    type: DataTypes.UUID, // Tipo UUID para coincidir con User.id
    allowNull: false, // Obligatorio
    references: {
      model: 'users', // Nombre de la tabla referenciada
      key: 'id' // Campo referenciado
    }
  },
  // Campo fisio_id: clave foránea que referencia al usuario fisioterapeuta
  fisio_id: {
    type: DataTypes.UUID, // Tipo UUID para coincidir con User.id
    allowNull: false, // Obligatorio
    references: {
      model: 'users', // Nombre de la tabla referenciada
      key: 'id' // Campo referenciado
    }
  },
  motivo: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  // Opciones del modelo
  tableName: 'appointments', // Nombre de la tabla en la base de datos
  timestamps: true // Agrega campos createdAt y updatedAt automáticamente
});

// Exportamos el modelo Appointment para usarlo en otros archivos
module.exports = Appointment;