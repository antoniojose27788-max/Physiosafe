// models/Consent.js
// Definición del modelo Consent para Sequelize

// Importamos DataTypes de Sequelize para definir tipos de datos
const { DataTypes } = require('sequelize');

// Importamos la instancia de Sequelize desde la configuración de la base de datos
const { sequelize } = require('../config/db');

// Definimos el modelo Consent
const Consent = sequelize.define('Consent', {
  // Campo id: UUID único generado automáticamente
  id: {
    type: DataTypes.UUID, // Tipo UUID
    defaultValue: DataTypes.UUIDV4, // Valor por defecto generado automáticamente
    primaryKey: true, // Es la clave primaria
    allowNull: false // No puede ser nulo
  },
  // Campo aceptado: booleano que indica si el consentimiento fue aceptado
  aceptado: {
    type: DataTypes.BOOLEAN, // Tipo booleano
    allowNull: false, // Obligatorio
    defaultValue: false // Valor por defecto falso
  },
  // Campo fecha_firma: fecha en que se firmó el consentimiento
  fecha_firma: {
    type: DataTypes.DATE, // Tipo fecha
    allowNull: false // Obligatorio
  },
  // Campo user_id: clave foránea que referencia al usuario paciente
  user_id: {
    type: DataTypes.UUID, // Tipo UUID para coincidir con User.id
    allowNull: false, // Obligatorio
    references: {
      model: 'users', // Nombre de la tabla referenciada
      key: 'id' // Campo referenciado
    }
  }
}, {
  // Opciones del modelo
  tableName: 'consents', // Nombre de la tabla en la base de datos
  timestamps: true // Agrega campos createdAt y updatedAt automáticamente
});

// Exportamos el modelo Consent para usarlo en otros archivos
module.exports = Consent;