// models/Report.js
// Definición del modelo Report para Sequelize

// Importamos DataTypes de Sequelize para definir tipos de datos
const { DataTypes } = require('sequelize');

// Importamos la instancia de Sequelize desde la configuración de la base de datos
const { sequelize } = require('../config/db');

// Definimos el modelo Report
const Report = sequelize.define('Report', {
  // Campo id: UUID único generado automáticamente
  id: {
    type: DataTypes.UUID, // Tipo UUID
    defaultValue: DataTypes.UUIDV4, // Valor por defecto generado automáticamente
    primaryKey: true, // Es la clave primaria
    allowNull: false // No puede ser nulo
  },
  // Campo descripcion: cadena de texto para la descripción del reporte
  descripcion: {
    type: DataTypes.TEXT, // Tipo texto largo
    allowNull: false // Obligatorio
  },
  // Campo archivo_url: cadena de texto para la URL del archivo adjunto (opcional)
  archivo_url: {
    type: DataTypes.STRING, // Tipo string
    allowNull: true // Opcional
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
  }
}, {
  // Opciones del modelo
  tableName: 'reports', // Nombre de la tabla en la base de datos
  timestamps: true // Agrega campos createdAt y updatedAt automáticamente
});

// Exportamos el modelo Report para usarlo en otros archivos
module.exports = Report;