// config/db.js
// Configuración de la conexión a la base de datos PostgreSQL usando Sequelize

// Importamos Sequelize para manejar la ORM
const { Sequelize } = require('sequelize');

// Cargamos las variables de entorno desde el archivo .env
require('dotenv').config();

// Creamos una instancia de Sequelize usando la URL de la base de datos
// La URL incluye el host, puerto, nombre de la base de datos, usuario y contraseña
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  // Configuraciones adicionales para PostgreSQL
  dialect: 'postgres', // Especificamos que usamos PostgreSQL
  logging: false, // Desactivamos el logging de consultas SQL en consola para producción
  pool: {
    max: 5, // Máximo de conexiones en el pool
    min: 0, // Mínimo de conexiones
    acquire: 30000, // Tiempo máximo para adquirir una conexión (ms)
    idle: 10000 // Tiempo máximo que una conexión puede estar inactiva (ms)
  }
});

// Función para probar la conexión a la base de datos
const testConnection = async () => {
  try {
    // Intentamos autenticar la conexión
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');
  } catch (error) {
    // Si hay error, lo mostramos en consola
    console.error('Error al conectar a la base de datos:', error);
  }
};

// Exportamos la instancia de Sequelize y la función de prueba
module.exports = { sequelize, testConnection };