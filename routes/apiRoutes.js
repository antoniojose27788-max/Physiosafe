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
router.get('/users', apiController.getUsers);
router.get('/users/:id', apiController.getUser);


// ============================================================
// RUTAS DE FACTURAS (BILLS)
// ============================================================
const billController = require('../controllers/billController');
router.get('/bills', billController.getBills);
router.post('/bills', billController.createBill);
router.put('/bills/:id', billController.updateBillStatus);

// ============================================================
// RUTAS DE EXPEDIENTES (RECORDS)
// ============================================================
const recordController = require('../controllers/recordController');
router.get('/records', recordController.getRecords);
router.post('/records', recordController.createRecord);

module.exports = router;