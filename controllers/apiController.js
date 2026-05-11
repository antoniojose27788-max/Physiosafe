// controllers/apiController.js
const { Appointment, User } = require('../models'); // Asegúrate de que los modelos existan

// 1. Obtener Estadísticas del Dashboard
exports.getDashboardStats = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        const rol = req.user.rol;

        let totalCitas, citasPendientes;

        // Si es paciente, solo contamos SUS citas. Si es admin/fisio, contamos TODAS.
        if (rol === 'paciente') {
            totalCitas = await Appointment.count({ where: { paciente_id: usuarioId } });
            citasPendientes = await Appointment.count({ where: { paciente_id: usuarioId, estado: 'pendiente' } });
        } else {
            totalCitas = await Appointment.count();
            citasPendientes = await Appointment.count({ where: { estado: 'pendiente' } });
        }

        res.json({
            totalCitas,
            citasPendientes,
            totalReportes: 0, // Placeholder para cuando crees el modelo Report
            totalConsentimientos: 0 // Placeholder para Consent
        });
    } catch (error) {
        console.error('Error al cargar stats:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// 2. Obtener lista de citas
exports.getAppointments = async (req, res) => {
    try {
        const rol = req.user.rol;
        const usuarioId = req.user.id;
        
        let citas;
        
        // Para que no falle si aún no has configurado las relaciones (belongsTo) en Sequelize, 
        // hacemos una búsqueda básica de momento.
        if (rol === 'paciente') {
            citas = await Appointment.findAll({ where: { paciente_id: usuarioId }, order: [['fecha_hora', 'DESC']] });
        } else {
            citas = await Appointment.findAll({ order: [['fecha_hora', 'DESC']] });
        }

        res.json(citas);
    } catch (error) {
        console.error('Error al obtener citas:', error);
        res.status(500).json({ error: 'Error al obtener las citas' });
    }
};

// Añade esto AL FINAL de tu controllers/apiController.js

// 3. Crear una nueva cita (FUNCIONALIDAD SAAS REAL)
exports.createAppointment = async (req, res) => {
    try {
        const { fecha_hora } = req.body;
        const paciente_id = req.user.id; // Lo sacamos del token de seguridad

        // Creamos la cita en PostgreSQL
        const nuevaCita = await Appointment.create({
            fecha_hora: fecha_hora,
            estado: 'pendiente',
            paciente_id: paciente_id
        });

        res.status(201).json({ message: 'Cita creada con éxito', cita: nuevaCita });
    } catch (error) {
        console.error('Error al crear la cita:', error);
        res.status(500).json({ error: 'Error al agendar la cita en la base de datos' });
    }
};

// 4. Cancelar (Eliminar) una cita
exports.deleteAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { Appointment } = require('../models');
        
        // El paciente solo puede borrar SUS propias citas
        const eliminados = await Appointment.destroy({
            where: { id: id, paciente_id: req.user.id }
        });

        if (eliminados === 0) {
            return res.status(404).json({ error: 'Cita no encontrada o no tienes permiso' });
        }

        res.json({ message: 'Cita cancelada correctamente' });
    } catch (error) {
        console.error('Error al cancelar:', error);
        res.status(500).json({ error: 'Error del servidor al cancelar la cita' });
    }
};