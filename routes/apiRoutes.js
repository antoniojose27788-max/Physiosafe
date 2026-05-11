// routes/apiRoutes.js
// Rutas generales de la API (citas, reportes, consentimientos, etc.)

const express = require('express');
const {
  getUsers, createUser, deleteUser, requireRole,
  getAppointments, createAppointment, updateAppointment, deleteAppointment, getMonthAppointments,
  getReports, createReport, updateReport, deleteReport,
  getConsents, signConsent,
  verifyToken
} = require('../controllers/apiController'); // Importamos el controlador
const router = express.Router();

// Middleware para proteger todas las rutas de la API
router.use(verifyToken);

// Rutas para usuarios (solo admin)
router.route('/users')
  .get(requireRole(['admin']), getUsers)
  .post(requireRole(['admin']), createUser);

router.route('/users/:id')
  .delete(requireRole(['admin']), deleteUser);

// Rutas para citas
router.route('/appointments')
  .get(getAppointments)
  .post(createAppointment);

router.route('/appointments/:id')
  .put(updateAppointment)
  .delete(deleteAppointment);

// Ruta para obtener citas de un mes específico (para calendario)
router.get('/appointments/calendar/month', getMonthAppointments);

// Rutas para reportes
router.route('/reports')
  .get(getReports)
  .post(createReport);

router.route('/reports/:id')
  .put(updateReport)
  .delete(deleteReport);

// Rutas para consentimientos
router.route('/consents')
  .get(getConsents)
  .post(signConsent);

module.exports = router;