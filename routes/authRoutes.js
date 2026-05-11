// routes/authRoutes.js
// Rutas para autenticación (login, registro, etc.)

const express = require('express');
const { register, login, verifyToken, verify } = require('../controllers/authController'); // Importamos el controlador
const router = express.Router();

// Ruta para registro de usuarios
// POST /api/auth/register
router.post('/register', register);

// Ruta para login
// POST /api/auth/login
router.post('/login', login);

// Ruta para verificar token JWT (protegida)
// GET /api/auth/verify
router.get('/verify', verifyToken, verify);

module.exports = router;