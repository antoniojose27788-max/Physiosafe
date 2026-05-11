// models/User.js
// Definición del modelo User para Sequelize

// Importamos DataTypes de Sequelize para definir tipos de datos
const { DataTypes } = require('sequelize');

// Importamos la instancia de Sequelize desde la configuración de la base de datos
const { sequelize } = require('../config/db');

// Definimos el modelo User
const User = sequelize.define('User', {
  // Campo id: UUID único generado automáticamente
  id: {
    type: DataTypes.UUID, // Tipo UUID
    defaultValue: DataTypes.UUIDV4, // Valor por defecto generado automáticamente
    primaryKey: true, // Es la clave primaria
    allowNull: false // No puede ser nulo
  },
  // Campo nombre: cadena de texto para el nombre del usuario
  nombre: {
    type: DataTypes.STRING, // Tipo string
    allowNull: false // Obligatorio
  },
  // Campo email: cadena de texto única para el correo electrónico
  email: {
    type: DataTypes.STRING, // Tipo string
    allowNull: false, // Obligatorio
    unique: true // Debe ser único en la tabla
  },
  // Campo password: cadena de texto para la contraseña (se hasheará con bcrypt)
  password: {
    type: DataTypes.STRING, // Tipo string
    allowNull: false // Obligatorio
  },
  // Campo rol: enumeración con valores fijos
  rol: {
    type: DataTypes.ENUM('admin', 'fisio', 'paciente'), // Valores permitidos
    allowNull: false // Obligatorio
  }
}, {
  // Opciones del modelo
  tableName: 'users', // Nombre de la tabla en la base de datos
  timestamps: true // Agrega campos createdAt y updatedAt automáticamente
});

// Exportamos el modelo User para usarlo en otros archivos
module.exports = User;