// controllers/apiController.js
// Controlador para la API de citas, reportes y consentimientos

const { User, Appointment, Report, Consent } = require('../models');
const { Op } = require('sequelize');

// ============================================================
// CITAS (APPOINTMENTS)
// ============================================================

/**
 * Obtener todas las citas del usuario autenticado
 * GET /api/appointments
 */
exports.getAppointments = async (req, res) => {
    try {
        const userId = req.user.id;
        const { estado, mes } = req.query;

        let where = {
            [Op.or]: [
                { paciente_id: userId },
                { fisio_id: userId }
            ]
        };

        // Filtrar por estado si se proporciona
        if (estado) {
            where.estado = estado;
        }

        // Filtrar por mes si se proporciona
        if (mes) {
            const year = new Date().getFullYear();
            const startDate = new Date(year, parseInt(mes) - 1, 1);
            const endDate = new Date(year, parseInt(mes), 0);
            where.fecha_hora = {
                [Op.between]: [startDate, endDate]
            };
        }

        const appointments = await Appointment.findAll({
            where,
            include: [
                { model: User, as: 'paciente', attributes: ['id', 'nombre', 'email'] },
                { model: User, as: 'fisio', attributes: ['id', 'nombre', 'email'] }
            ],
            order: [['fecha_hora', 'ASC']]
        });

        res.json(appointments);
    } catch (error) {
        console.error('Error al obtener citas:', error);
        res.status(500).json({
            error: 'Error al obtener citas',
            detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Crear una nueva cita
 * POST /api/appointments
 */
exports.createAppointment = async (req, res) => {
    try {
        const { fecha_hora, fisio_id, paciente_id } = req.body;
        const userId = req.user.id;

        // Validar campos requeridos
        if (!fecha_hora || !fisio_id || !paciente_id) {
            return res.status(400).json({
                error: 'Los campos fecha_hora, fisio_id y paciente_id son requeridos'
            });
        }

        // Verificar que el usuario tenga permiso para crear la cita
        if (req.user.rol !== 'admin' && userId !== paciente_id && userId !== fisio_id) {
            return res.status(403).json({
                error: 'No tienes permiso para crear esta cita'
            });
        }

        // Verificar que ambos usuarios existan
        const paciente = await User.findByPk(paciente_id);
        const fisio = await User.findByPk(fisio_id);

        if (!paciente || !fisio) {
            return res.status(404).json({
                error: 'Paciente o fisioterapeuta no encontrado'
            });
        }

        // Verificar que no haya conflicto de horario
        const conflicto = await Appointment.findOne({
            where: {
                [Op.or]: [
                    { paciente_id },
                    { fisio_id }
                ],
                fecha_hora,
                estado: 'pendiente'
            }
        });

        if (conflicto) {
            return res.status(400).json({
                error: 'Existe un conflicto de horario'
            });
        }

        // Crear la cita
        const appointment = await Appointment.create({
            fecha_hora,
            fisio_id,
            paciente_id,
            estado: 'pendiente'
        });

        res.status(201).json({
            message: 'Cita creada exitosamente',
            appointment
        });
    } catch (error) {
        console.error('Error al crear cita:', error);
        res.status(500).json({
            error: 'Error al crear cita',
            detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Actualizar una cita
 * PUT /api/appointments/:id
 */
exports.updateAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha_hora, estado } = req.body;
        const userId = req.user.id;

        const appointment = await Appointment.findByPk(id);
        if (!appointment) {
            return res.status(404).json({
                error: 'Cita no encontrada'
            });
        }

        // Verificar permisos
        if (req.user.rol !== 'admin' && userId !== appointment.fisio_id && userId !== appointment.paciente_id) {
            return res.status(403).json({
                error: 'No tienes permiso para actualizar esta cita'
            });
        }

        // Actualizar campos
        if (fecha_hora) appointment.fecha_hora = fecha_hora;
        if (estado) appointment.estado = estado;

        await appointment.save();

        res.json({
            message: 'Cita actualizada exitosamente',
            appointment
        });
    } catch (error) {
        console.error('Error al actualizar cita:', error);
        res.status(500).json({
            error: 'Error al actualizar cita',
            detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Eliminar una cita
 * DELETE /api/appointments/:id
 */
exports.deleteAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const appointment = await Appointment.findByPk(id);
        if (!appointment) {
            return res.status(404).json({
                error: 'Cita no encontrada'
            });
        }

        // Verificar permisos
        if (req.user.rol !== 'admin' && userId !== appointment.fisio_id && userId !== appointment.paciente_id) {
            return res.status(403).json({
                error: 'No tienes permiso para eliminar esta cita'
            });
        }

        await appointment.destroy();

        res.json({
            message: 'Cita eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar cita:', error);
        res.status(500).json({
            error: 'Error al eliminar cita',
            detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ============================================================
// REPORTES (REPORTS)
// ============================================================

/**
 * Obtener todos los reportes
 * GET /api/reports
 */
exports.getReports = async (req, res) => {
    try {
        const userId = req.user.id;

        let where = {};
        if (req.user.rol === 'paciente') {
            where.paciente_id = userId;
        } else if (req.user.rol === 'fisio') {
            where.fisio_id = userId;
        }

        const reports = await Report.findAll({
            where,
            include: [
                { model: User, as: 'paciente', attributes: ['id', 'nombre'] },
                { model: User, as: 'fisio', attributes: ['id', 'nombre'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(reports);
    } catch (error) {
        console.error('Error al obtener reportes:', error);
        res.status(500).json({
            error: 'Error al obtener reportes',
            detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Crear un nuevo reporte
 * POST /api/reports
 */
exports.createReport = async (req, res) => {
    try {
        const { descripcion, paciente_id, archivo_url } = req.body;
        const userId = req.user.id;

        // Validar campos requeridos
        if (!descripcion || !paciente_id) {
            return res.status(400).json({
                error: 'Los campos descripcion y paciente_id son requeridos'
            });
        }

        // Solo fisios pueden crear reportes
        if (req.user.rol !== 'admin' && req.user.rol !== 'fisio') {
            return res.status(403).json({
                error: 'Solo fisioterapeutas pueden crear reportes'
            });
        }

        // Verificar que el paciente exista
        const paciente = await User.findByPk(paciente_id);
        if (!paciente) {
            return res.status(404).json({
                error: 'Paciente no encontrado'
            });
        }

        const report = await Report.create({
            descripcion,
            paciente_id,
            fisio_id: userId,
            archivo_url
        });

        res.status(201).json({
            message: 'Reporte creado exitosamente',
            report
        });
    } catch (error) {
        console.error('Error al crear reporte:', error);
        res.status(500).json({
            error: 'Error al crear reporte',
            detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Obtener un reporte específico
 * GET /api/reports/:id
 */
exports.getReport = async (req, res) => {
    try {
        const { id } = req.params;

        const report = await Report.findByPk(id, {
            include: [
                { model: User, as: 'paciente', attributes: ['id', 'nombre', 'email'] },
                { model: User, as: 'fisio', attributes: ['id', 'nombre', 'email'] }
            ]
        });

        if (!report) {
            return res.status(404).json({
                error: 'Reporte no encontrado'
            });
        }

        // Verificar permisos
        if (req.user.rol !== 'admin' && req.user.id !== report.fisio_id && req.user.id !== report.paciente_id) {
            return res.status(403).json({
                error: 'No tienes permiso para acceder a este reporte'
            });
        }

        res.json(report);
    } catch (error) {
        console.error('Error al obtener reporte:', error);
        res.status(500).json({
            error: 'Error al obtener reporte',
            detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ============================================================
// CONSENTIMIENTOS (CONSENTS)
// ============================================================

/**
 * Obtener consentimientos del usuario
 * GET /api/consents
 */
exports.getConsents = async (req, res) => {
    try {
        const userId = req.user.id;

        const consents = await Consent.findAll({
            where: { user_id: userId },
            order: [['fecha_firma', 'DESC']]
        });

        res.json(consents);
    } catch (error) {
        console.error('Error al obtener consentimientos:', error);
        res.status(500).json({
            error: 'Error al obtener consentimientos',
            detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Crear un nuevo consentimiento
 * POST /api/consents
 */
exports.createConsent = async (req, res) => {
    try {
        const { aceptado } = req.body;
        const userId = req.user.id;

        if (aceptado === undefined || aceptado === null) {
            return res.status(400).json({
                error: 'El campo aceptado es requerido'
            });
        }

        const consent = await Consent.create({
            user_id: userId,
            aceptado,
            fecha_firma: new Date()
        });

        res.status(201).json({
            message: 'Consentimiento registrado exitosamente',
            consent
        });
    } catch (error) {
        console.error('Error al crear consentimiento:', error);
        res.status(500).json({
            error: 'Error al crear consentimiento',
            detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ============================================================
// ESTADÍSTICAS Y DATOS
// ============================================================

/**
 * Obtener estadísticas del usuario
 * GET /api/stats
 */
exports.getStats = async (req, res) => {
    try {
        const userId = req.user.id;

        let appointmentWhere = {
            [Op.or]: [
                { paciente_id: userId },
                { fisio_id: userId }
            ]
        };

        const stats = {
            totalAppointments: await Appointment.count({ where: appointmentWhere }),
            pendingAppointments: await Appointment.count({
                where: { ...appointmentWhere, estado: 'pendiente' }
            }),
            completedAppointments: await Appointment.count({
                where: { ...appointmentWhere, estado: 'completada' }
            })
        };

        if (req.user.rol !== 'paciente') {
            stats.totalReports = await Report.count({ where: { fisio_id: userId } });
            stats.totalPatients = await User.count({ where: { rol: 'paciente' } });
        }

        res.json(stats);
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            error: 'Error al obtener estadísticas',
            detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Obtener todos los usuarios (solo admin)
 * GET /api/users
 */
exports.getUsers = async (req, res) => {
    try {
        if (req.user.rol !== 'admin') {
            return res.status(403).json({
                error: 'Solo administradores pueden acceder a este recurso'
            });
        }

        const users = await User.findAll({
            attributes: ['id', 'nombre', 'email', 'rol', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });

        res.json(users);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({
            error: 'Error al obtener usuarios',
            detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Obtener un usuario específico
 * GET /api/users/:id
 */
exports.getUser = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        if (req.user.rol !== 'admin' && userId !== id) {
            return res.status(403).json({
                error: 'No tienes permiso para acceder a este usuario'
            });
        }

        const user = await User.findByPk(id, {
            attributes: ['id', 'nombre', 'email', 'rol', 'createdAt']
        });

        if (!user) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        res.json(user);
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({
            error: 'Error al obtener usuario',
            detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
