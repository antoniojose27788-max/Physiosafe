const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const authGuard = require('../middlewares/authMiddleware');

// Aplicamos el protector a todas las rutas
router.use(authGuard);

// ============================================================
// RUTAS DE CITAS (APPOINTMENTS)
// ============================================================

router.get('/appointments', apiController.getAppointments);
router.post('/appointments', apiController.createAppointment);
router.put('/appointments/:id', apiController.updateAppointment);
router.delete('/appointments/:id', apiController.deleteAppointment);

// ============================================================
// RUTAS DE REPORTES (REPORTS)
// ============================================================

router.get('/reports', apiController.getReports);
router.post('/reports', apiController.createReport);
router.get('/reports/:id', apiController.getReport);

// ============================================================
// RUTAS DE CONSENTIMIENTOS (CONSENTS)
// ============================================================

router.get('/consents', apiController.getConsents);
router.post('/consents', apiController.createConsent);

// ============================================================
// RUTAS DE ESTADÍSTICAS Y USUARIOS
// ============================================================

router.get('/stats', apiController.getStats);
router.get('/physios', apiController.getPhysios);
router.get('/patients', apiController.getPatients);

router.get('/bills', apiController.getBills);
router.post('/bills', apiController.createBill);
router.put('/bills/:id', apiController.updateBill);

router.get('/records', apiController.getRecords);
router.post('/records', apiController.createRecord);
router.get('/records/:id', apiController.getRecord);
router.put('/records/:id', apiController.updateRecord);

router.get('/users', apiController.getUsers);
router.get('/users/:id', apiController.getUser);

module.exports = router;