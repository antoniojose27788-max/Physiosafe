// server.js
// Archivo principal del servidor para PhysioSafe

// Importamos las dependencias necesarias
const express = require('express'); // Framework web para Node.js
const cors = require('cors'); // Middleware para habilitar CORS
require('dotenv').config(); // Cargamos variables de entorno desde .env

// Importamos la configuración de la base de datos y modelos
const { sequelize, syncDatabase } = require('./models');

// Creamos una instancia de la aplicación Express
const app = express();

// Definimos el puerto del servidor desde las variables de entorno o valor por defecto
const PORT = process.env.PORT || 3000;

// Middlewares globales
// Middleware para parsear JSON en las solicitudes
app.use(express.json({ limit: '10mb' })); // Limitamos el tamaño del body para seguridad

// Middleware para parsear datos de formularios URL-encoded
app.use(express.urlencoded({ extended: true }));

// Middleware CORS para permitir solicitudes desde el frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Origen permitido (configurable)
  credentials: true // Permitir envío de cookies y headers de autenticación
}));

// Middleware para servir archivos estáticos desde la carpeta public
app.use(express.static('public'));

// Middleware de logging básico para desarrollo
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Rutas de la aplicación
// Placeholder para rutas de autenticación (se implementarán en authRoutes.js)
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Placeholder para rutas de API general (se implementarán en apiRoutes.js)
const apiRoutes = require('./routes/apiRoutes');
app.use('/api', apiRoutes);

// Ruta raíz para verificar que el servidor está funcionando
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenido a PhysioSafe - API de Gestión de Clínica de Fisioterapia',
    version: '1.0.0',
    status: 'Servidor activo'
  });
});

// Middleware para manejar rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: 'La ruta solicitada no existe en este servidor'
  });
});

// Middleware global para manejo de errores
app.use((err, req, res, next) => {
  console.error('Error en el servidor:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// Función para iniciar el servidor
const startServer = async () => {
  try {
    // Probamos la conexión a la base de datos
    await sequelize.authenticate();
    console.log('Conexión a la base de datos verificada.');

    // Sincronizamos los modelos con la base de datos (solo para desarrollo)
    await syncDatabase();

    // Iniciamos el servidor en el puerto especificado
    app.listen(PORT, () => {
      console.log(`Servidor PhysioSafe ejecutándose en http://localhost:${PORT}`);
      console.log('Presiona Ctrl+C para detener el servidor.');
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1); // Salimos del proceso si hay error crítico
  }
};

// Iniciamos el servidor
startServer();

// Exportamos la app para testing (opcional)
module.exports = app;