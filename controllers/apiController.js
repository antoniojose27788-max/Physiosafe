// controllers/apiController.js
// Controlador para la API de citas, reportes y consentimientos

const { User, Appointment, Report, Consent, Bill, Record } = require('../models');
const { Op } = require('sequelize');

const isStaff = (rol) => rol === 'admin' || rol === 'fisio';

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

        let where = {};
        if (isStaff(req.user.rol)) {
            // Admin y fisioterapeuta ven todas las citas de la clínica
            where = {};
        } else {
            // Paciente: solo sus citas
            where = { paciente_id: userId };
        }

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
        let { fecha_hora, fisio_id, paciente_id, motivo, observaciones } = req.body;
        const userId = req.user.id;

        if (!fecha_hora) {
            return res.status(400).json({
                error: 'El campo fecha_hora es requerido'
            });
        }

        // Flujo paciente (dashboard): motivo + fecha; asigna paciente y fisioterapeuta
        if (req.user.rol === 'paciente') {
            paciente_id = userId;
            if (!fisio_id) {
                const primerFisio = await User.findOne({ where: { rol: 'fisio' }, order: [['createdAt', 'ASC']] });
                if (!primerFisio) {
                    return res.status(400).json({
                        error: 'No hay fisioterapeutas disponibles en el sistema. Contacte con administración.'
                    });
                }
                fisio_id = primerFisio.id;
            }
        }

        if (!fisio_id || !paciente_id) {
            return res.status(400).json({
                error: 'Los campos fecha_hora, fisio_id y paciente_id son requeridos (o inicie sesión como paciente para reservar)'
            });
        }

        // Verificar que el usuario tenga permiso para crear la cita
        if (!isStaff(req.user.rol) && userId !== paciente_id && userId !== fisio_id) {
            return res.status(403).json({
                error: 'No tienes permiso para crear esta cita'
            });
        }

        // Verificar que ambos usuarios existan
        const paciente = await User.findByPk(paciente_id);
        const fisio = await User.findByPk(fisio_id);

        if (!paciente || paciente.rol !== 'paciente') {
            return res.status(404).json({
                error: 'Paciente no encontrado o rol inválido'
            });
        }
        if (!fisio || fisio.rol !== 'fisio') {
            return res.status(404).json({
                error: 'Fisioterapeuta no encontrado o rol inválido'
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
            estado: 'pendiente',
            motivo: motivo || null,
            observaciones: observaciones || null
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
        if (!isStaff(req.user.rol) && userId !== appointment.fisio_id && userId !== appointment.paciente_id) {
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
        if (!isStaff(req.user.rol) && userId !== appointment.fisio_id && userId !== appointment.paciente_id) {
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
        // admin: sin filtro — ve todos los reportes

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

        let appointmentWhere = {};
        if (isStaff(req.user.rol)) {
            appointmentWhere = {};
        } else {
            appointmentWhere = {
                [Op.or]: [
                    { paciente_id: userId },
                    { fisio_id: userId }
                ]
            };
        }

        const stats = {
            totalAppointments: await Appointment.count({ where: appointmentWhere }),
            pendingAppointments: await Appointment.count({
                where: { ...appointmentWhere, estado: 'pendiente' }
            }),
            completedAppointments: await Appointment.count({
                where: { ...appointmentWhere, estado: 'completada' }
            })
        };

        if (req.user.rol === 'admin') {
            stats.totalReports = await Report.count();
            stats.totalPatients = await User.count({ where: { rol: 'paciente' } });
        } else if (req.user.rol === 'fisio') {
            stats.totalReports = await Report.count({ where: { fisio_id: userId } });
            stats.totalPatients = await User.count({ where: { rol: 'paciente' } });
        }

        // Facturación / ingresos
        let billWherePaid = { estado: 'pagada' };
        let billWherePending = { estado: 'emitida' };
        if (!isStaff(req.user.rol)) {
            billWherePaid = { ...billWherePaid, paciente_id: userId };
            billWherePending = { ...billWherePending, paciente_id: userId };
        }

        const ingresosCobrados = await Bill.sum('monto', { where: billWherePaid }) || 0;
        const pendienteCobro = await Bill.sum('monto', { where: billWherePending }) || 0;

        stats.ingresosCobrados = Number(ingresosCobrados);
        stats.pendienteCobro = Number(pendienteCobro);
        stats.totalFacturas = await Bill.count({
            where: isStaff(req.user.rol) ? {} : { paciente_id: userId }
        });

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
 * Listado de fisioterapeutas (para reservas y filtros)
 * GET /api/physios
 */
exports.getPhysios = async (req, res) => {
    try {
        const physios = await User.findAll({
            where: { rol: 'fisio' },
            attributes: ['id', 'nombre', 'email'],
            order: [['nombre', 'ASC']]
        });
        res.json(physios);
    } catch (error) {
        console.error('Error al obtener fisioterapeutas:', error);
        res.status(500).json({
            error: 'Error al obtener fisioterapeutas',
            detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Listado de pacientes (admin / fisio)
 * GET /api/patients
 */
exports.getPatients = async (req, res) => {
    try {
        if (!isStaff(req.user.rol)) {
            return res.status(403).json({ error: 'No autorizado' });
        }
        const patients = await User.findAll({
            where: { rol: 'paciente' },
            attributes: ['id', 'nombre', 'email', 'createdAt'],
            order: [['nombre', 'ASC']]
        });
        res.json(patients);
    } catch (error) {
        console.error('Error al obtener pacientes:', error);
        res.status(500).json({
            error: 'Error al obtener pacientes',
            detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ============================================================
// FACTURAS (BILLS)
// ============================================================

async function generarNumeroFactura() {
    const year = new Date().getFullYear();
    const count = await Bill.count();
    return `FAC-${year}-${String(count + 1).padStart(5, '0')}`;
}

exports.getBills = async (req, res) => {
    try {
        const userId = req.user.id;
        const where = isStaff(req.user.rol) ? {} : { paciente_id: userId };

        const bills = await Bill.findAll({
            where,
            include: [
                { model: User, as: 'paciente', attributes: ['id', 'nombre', 'email'] },
                { model: User, as: 'creadoPor', attributes: ['id', 'nombre'], required: false }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(bills);
    } catch (error) {
        console.error('Error al obtener facturas:', error);
        res.status(500).json({
            error: 'Error al obtener facturas',
            detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.createBill = async (req, res) => {
    try {
        if (!isStaff(req.user.rol)) {
            return res.status(403).json({ error: 'Solo el personal autorizado puede crear facturas' });
        }
        const { paciente_id, monto, concepto, estado } = req.body;
        if (!paciente_id || monto === undefined || monto === null) {
            return res.status(400).json({ error: 'paciente_id y monto son requeridos' });
        }
        const paciente = await User.findByPk(paciente_id);
        if (!paciente || paciente.rol !== 'paciente') {
            return res.status(404).json({ error: 'Paciente no válido' });
        }
        const numero_factura = await generarNumeroFactura();
        const bill = await Bill.create({
            numero_factura,
            paciente_id,
            monto: parseFloat(monto),
            concepto: concepto || null,
            estado: estado && ['emitida', 'pagada', 'anulada'].includes(estado) ? estado : 'emitida',
            creado_por_id: req.user.id
        });
        res.status(201).json({ message: 'Factura creada', bill });
    } catch (error) {
        console.error('Error al crear factura:', error);
        res.status(500).json({
            error: 'Error al crear factura',
            detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.updateBill = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, monto, concepto } = req.body;
        const bill = await Bill.findByPk(id);
        if (!bill) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }
        if (!isStaff(req.user.rol)) {
            return res.status(403).json({ error: 'No autorizado' });
        }
        if (estado && ['emitida', 'pagada', 'anulada'].includes(estado)) bill.estado = estado;
        if (monto !== undefined && monto !== null) bill.monto = parseFloat(monto);
        if (concepto !== undefined) bill.concepto = concepto;
        await bill.save();
        res.json({ message: 'Factura actualizada', bill });
    } catch (error) {
        console.error('Error al actualizar factura:', error);
        res.status(500).json({
            error: 'Error al actualizar factura',
            detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ============================================================
// EXPEDIENTE CLÍNICO (RECORDS)
// ============================================================

exports.getRecords = async (req, res) => {
    try {
        const userId = req.user.id;
        let where = {};
        if (req.user.rol === 'paciente') {
            where.paciente_id = userId;
        } else if (req.user.rol === 'fisio') {
            where = {}; // fisio ve todos los expedientes de la clínica
        }
        // admin: todos

        const records = await Record.findAll({
            where,
            include: [
                { model: User, as: 'paciente', attributes: ['id', 'nombre', 'email'] },
                { model: User, as: 'fisio', attributes: ['id', 'nombre'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(records);
    } catch (error) {
        console.error('Error al obtener expedientes:', error);
        res.status(500).json({
            error: 'Error al obtener expedientes',
            detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.getRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await Record.findByPk(id, {
            include: [
                { model: User, as: 'paciente', attributes: ['id', 'nombre', 'email'] },
                { model: User, as: 'fisio', attributes: ['id', 'nombre', 'email'] }
            ]
        });
        if (!record) {
            return res.status(404).json({ error: 'Expediente no encontrado' });
        }
        if (req.user.rol === 'paciente' && record.paciente_id !== req.user.id) {
            return res.status(403).json({ error: 'No autorizado' });
        }
        res.json(record);
    } catch (error) {
        console.error('Error al obtener expediente:', error);
        res.status(500).json({
            error: 'Error al obtener expediente',
            detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.createRecord = async (req, res) => {
    try {
        if (!isStaff(req.user.rol)) {
            return res.status(403).json({ error: 'Solo el personal clínico puede crear expedientes' });
        }
        const { paciente_id, diagnostico, tratamientos, evolucion } = req.body;
        if (!paciente_id) {
            return res.status(400).json({ error: 'paciente_id es requerido' });
        }
        const paciente = await User.findByPk(paciente_id);
        if (!paciente || paciente.rol !== 'paciente') {
            return res.status(404).json({ error: 'Paciente no válido' });
        }
        let fisio_id = req.user.id;
        if (req.user.rol === 'admin') {
            const { fisio_id: bodyFisio } = req.body;
            if (bodyFisio) {
                const f = await User.findByPk(bodyFisio);
                if (!f || f.rol !== 'fisio') {
                    return res.status(400).json({ error: 'fisio_id no válido para administrador' });
                }
                fisio_id = bodyFisio;
            } else {
                const primerFisio = await User.findOne({ where: { rol: 'fisio' }, order: [['createdAt', 'ASC']] });
                if (!primerFisio) {
                    return res.status(400).json({ error: 'No hay fisioterapeuta para asociar al expediente' });
                }
                fisio_id = primerFisio.id;
            }
        }
        const record = await Record.create({
            paciente_id,
            fisio_id,
            diagnostico: diagnostico || null,
            tratamientos: tratamientos || null,
            evolucion: evolucion || null
        });
        res.status(201).json({ message: 'Expediente registrado', record });
    } catch (error) {
        console.error('Error al crear expediente:', error);
        res.status(500).json({
            error: 'Error al crear expediente',
            detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.updateRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const { diagnostico, tratamientos, evolucion } = req.body;
        const record = await Record.findByPk(id);
        if (!record) {
            return res.status(404).json({ error: 'Expediente no encontrado' });
        }
        if (!isStaff(req.user.rol)) {
            return res.status(403).json({ error: 'No autorizado' });
        }
        if (req.user.rol === 'fisio' && record.fisio_id !== req.user.id) {
            return res.status(403).json({ error: 'Solo puede editar sus propios expedientes' });
        }
        if (diagnostico !== undefined) record.diagnostico = diagnostico;
        if (tratamientos !== undefined) record.tratamientos = tratamientos;
        if (evolucion !== undefined) record.evolucion = evolucion;
        await record.save();
        res.json({ message: 'Expediente actualizado', record });
    } catch (error) {
        console.error('Error al actualizar expediente:', error);
        res.status(500).json({
            error: 'Error al actualizar expediente',
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
