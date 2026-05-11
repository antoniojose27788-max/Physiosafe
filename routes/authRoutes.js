const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authGuard = require('../middlewares/authMiddleware');

// RUTAS PÚBLICAS

/**
 * POST /api/auth/register
 * Registrar un nuevo usuario
 */
router.post('/register', authController.register);

/**
 * POST /api/auth/login
 * Iniciar sesión (obtener JWT token)
 */
router.post('/login', authController.login);

// RUTAS PROTEGIDAS (Requieren autenticación)

/**
 * GET /api/auth/me
 * Obtener datos del usuario autenticado
 */
router.get('/me', authGuard, authController.getMe);

/**
 * POST /api/auth/logout
 * Cerrar sesión
 */
router.post('/logout', authGuard, authController.logout);

/**
 * PUT /api/auth/update
 * Actualizar datos del usuario
 */
router.put('/update', authGuard, authController.updateUser);

module.exports = router;