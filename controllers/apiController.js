// controllers/apiController.js
// Controlador para manejar la lógica de la API general (usuarios, citas, reportes, consentimientos)

const { User, Appointment, Report, Consent } = require('../models'); // Importamos los modelos
const { verifyToken } = require('./authController'); // Importamos el middleware de verificación

// Middleware para verificar roles (ej. solo admin puede acceder a ciertas rutas)
const requireRole = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permisos para realizar esta acción'
      });
    }
    next();
  };
};

// ========== FUNCIONES PARA USUARIOS ==========

// Obtener lista de usuarios (solo admin)
const getUsers = async (req, res) => {
  try {
    const usuarios = await User.findAll({
      attributes: { exclude: ['password'] } // Excluimos la contraseña por seguridad
    });
    res.json({ usuarios });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Crear usuario (solo admin)
const createUser = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    // Validaciones
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({
        error: 'Campos requeridos faltantes',
        message: 'Nombre, email, password y rol son obligatorios'
      });
    }

    const rolesValidos = ['admin', 'fisio', 'paciente'];
    if (!rolesValidos.includes(rol)) {
      return res.status(400).json({
        error: 'Rol inválido',
        message: 'El rol debe ser admin, fisio o paciente'
      });
    }

    // Verificar email único
    const usuarioExistente = await User.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(409).json({
        error: 'Email ya registrado',
        message: 'Ya existe un usuario con este email'
      });
    }

    // Hashear password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const nuevoUsuario = await User.create({
      nombre,
      email,
      password: hashedPassword,
      rol
    });

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol
      }
    });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ========== FUNCIONES PARA CITAS ==========

// Obtener citas del usuario logueado
const getAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const appointments = await Appointment.findAll({
      where: req.user.rol === 'paciente' ? { paciente_id: userId } : { fisio_id: userId },
      include: [
        { model: User, as: 'paciente', attributes: ['id', 'nombre', 'email'] },
        { model: User, as: 'fisio', attributes: ['id', 'nombre', 'email'] }
      ]
    });
    res.json({ appointments });
  } catch (error) {
    console.error('Error al obtener citas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Crear cita
const createAppointment = async (req, res) => {
  try {
    const { fecha_hora, paciente_id, fisio_id } = req.body;
    const userId = req.user.id;
    const userRol = req.user.rol;

    // Validaciones
    if (!fecha_hora || !paciente_id || !fisio_id) {
      return res.status(400).json({
        error: 'Campos requeridos faltantes',
        message: 'Fecha/hora, paciente y fisioterapeuta son obligatorios'
      });
    }

    // Verificar que la fecha sea futura
    const appointmentDate = new Date(fecha_hora);
    if (appointmentDate <= new Date()) {
      return res.status(400).json({
        error: 'Fecha inválida',
        message: 'La cita debe ser programada para una fecha futura'
      });
    }

    // Verificar permisos: paciente solo puede crear citas para sí mismo, fisio para sus pacientes
    if (userRol === 'paciente' && paciente_id !== userId) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo puedes programar citas para ti mismo'
      });
    }

    if (userRol === 'fisio' && fisio_id !== userId) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo puedes programar citas como fisioterapeuta asignado'
      });
    }

    // Verificar que paciente y fisio existan
    const paciente = await User.findByPk(paciente_id);
    const fisio = await User.findByPk(fisio_id);

    if (!paciente || paciente.rol !== 'paciente') {
      return res.status(400).json({
        error: 'Paciente inválido',
        message: 'El paciente seleccionado no existe o no tiene el rol correcto'
      });
    }

    if (!fisio || fisio.rol !== 'fisio') {
      return res.status(400).json({
        error: 'Fisioterapeuta inválido',
        message: 'El fisioterapeuta seleccionado no existe o no tiene el rol correcto'
      });
    }

    // Crear cita
    const appointment = await Appointment.create({
      fecha_hora: appointmentDate,
      paciente_id,
      fisio_id,
      estado: 'pendiente'
    });

    res.status(201).json({
      message: 'Cita programada exitosamente',
      appointment
    });
  } catch (error) {
    console.error('Error creando cita:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ========== FUNCIONES PARA REPORTES ==========

// Obtener reportes
const getReports = async (req, res) => {
  try {
    const userId = req.user.id;
    const reports = await Report.findAll({
      where: req.user.rol === 'paciente' ? { paciente_id: userId } : { fisio_id: userId },
      include: [
        { model: User, as: 'paciente', attributes: ['id', 'nombre'] },
        { model: User, as: 'fisio', attributes: ['id', 'nombre'] }
      ]
    });
    res.json({ reports });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Crear reporte
const createReport = async (req, res) => {
  try {
    const { descripcion, archivo_url, paciente_id, fisio_id } = req.body;
    const userId = req.user.id;
    const userRol = req.user.rol;

    // Validaciones
    if (!descripcion || !paciente_id || !fisio_id) {
      return res.status(400).json({
        error: 'Campos requeridos faltantes',
        message: 'Descripción, paciente y fisioterapeuta son obligatorios'
      });
    }

    // Verificar permisos: paciente solo puede ver sus reportes, fisio solo los suyos
    if (userRol === 'paciente' && paciente_id !== userId) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo puedes crear reportes para ti mismo'
      });
    }

    if (userRol === 'fisio' && fisio_id !== userId) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo puedes crear reportes como fisioterapeuta asignado'
      });
    }

    // Verificar que paciente y fisio existan
    const paciente = await User.findByPk(paciente_id);
    const fisio = await User.findByPk(fisio_id);

    if (!paciente || paciente.rol !== 'paciente') {
      return res.status(400).json({
        error: 'Paciente inválido',
        message: 'El paciente seleccionado no existe o no tiene el rol correcto'
      });
    }

    if (!fisio || fisio.rol !== 'fisio') {
      return res.status(400).json({
        error: 'Fisioterapeuta inválido',
        message: 'El fisioterapeuta seleccionado no existe o no tiene el rol correcto'
      });
    }

    // Crear reporte
    const report = await Report.create({
      descripcion,
      archivo_url: archivo_url || null,
      paciente_id,
      fisio_id
    });

    res.status(201).json({
      message: 'Reporte creado exitosamente',
      report
    });
  } catch (error) {
    console.error('Error creando reporte:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ========== FUNCIONES PARA CONSENTIMIENTOS ==========

// Obtener consentimientos
const getConsents = async (req, res) => {
  try {
    const userId = req.user.id;
    const consents = await Consent.findAll({
      where: { user_id: userId },
      include: [{ model: User, as: 'user', attributes: ['id', 'nombre'] }]
    });
    res.json({ consents });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Firmar consentimiento
const signConsent = async (req, res) => {
  try {
    const { aceptado } = req.body;
    const userId = req.user.id;

    // Validaciones
    if (aceptado !== true) {
      return res.status(400).json({
        error: 'Consentimiento requerido',
        message: 'Debes aceptar el consentimiento para continuar'
      });
    }

    // Verificar que el usuario sea paciente
    if (req.user.rol !== 'paciente') {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo los pacientes pueden firmar consentimientos'
      });
    }

    // Verificar que no exista ya un consentimiento aceptado para este usuario
    const consentimientoExistente = await Consent.findOne({
      where: { user_id: userId, aceptado: true }
    });

    if (consentimientoExistente) {
      return res.status(409).json({
        error: 'Consentimiento ya firmado',
        message: 'Ya tienes un consentimiento firmado'
      });
    }

    // Crear consentimiento
    const consent = await Consent.create({
      aceptado: true,
      fecha_firma: new Date(),
      user_id: userId
    });

    res.status(201).json({
      message: 'Consentimiento firmado exitosamente',
      consent
    });
  } catch (error) {
    console.error('Error firmando consentimiento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ========== ACTUALIZAR CITA ==========

const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha_hora, estado } = req.body;
    const userId = req.user.id;
    const userRol = req.user.rol;

    // Obtener cita
    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({
        error: 'Cita no encontrada',
        message: 'La cita que intentas editar no existe'
      });
    }

    // Verificar permisos: solo el fisio o admin pueden editar
    if (userRol === 'fisio' && appointment.fisio_id !== userId) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo el fisioterapeuta asignado puede editar esta cita'
      });
    }

    if (userRol === 'paciente') {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Los pacientes no pueden editar citas'
      });
    }

    // Validar fecha si se proporciona
    if (fecha_hora) {
      const newDate = new Date(fecha_hora);
      if (newDate <= new Date()) {
        return res.status(400).json({
          error: 'Fecha inválida',
          message: 'La cita debe ser programada para una fecha futura'
        });
      }
      appointment.fecha_hora = newDate;
    }

    // Validar estado
    const estadosValidos = ['pendiente', 'confirmada', 'completada', 'cancelada'];
    if (estado && !estadosValidos.includes(estado)) {
      return res.status(400).json({
        error: 'Estado inválido',
        message: 'Estados válidos: pendiente, confirmada, completada, cancelada'
      });
    }

    if (estado) {
      appointment.estado = estado;
    }

    await appointment.save();

    res.json({
      message: 'Cita actualizada exitosamente',
      appointment
    });
  } catch (error) {
    console.error('Error actualizando cita:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ========== ELIMINAR CITA ==========

const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRol = req.user.rol;

    // Obtener cita
    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({
        error: 'Cita no encontrada',
        message: 'La cita que intentas eliminar no existe'
      });
    }

    // Verificar permisos: solo el fisio o admin pueden eliminar
    if (userRol === 'fisio' && appointment.fisio_id !== userId) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo el fisioterapeuta asignado puede eliminar esta cita'
      });
    }

    if (userRol === 'paciente') {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Los pacientes no pueden eliminar citas'
      });
    }

    await appointment.destroy();

    res.json({ message: 'Cita eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando cita:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ========== ACTUALIZAR REPORTE ==========

const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, archivo_url } = req.body;
    const userId = req.user.id;
    const userRol = req.user.rol;

    // Obtener reporte
    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({
        error: 'Reporte no encontrado',
        message: 'El reporte que intentas editar no existe'
      });
    }

    // Verificar permisos: solo el fisio o admin pueden editar
    if (userRol === 'fisio' && report.fisio_id !== userId) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo el fisioterapeuta que creó este reporte puede editarlo'
      });
    }

    if (userRol === 'paciente') {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Los pacientes no pueden editar reportes'
      });
    }

    // Actualizar campos
    if (descripcion) report.descripcion = descripcion;
    if (archivo_url !== undefined) report.archivo_url = archivo_url || null;

    await report.save();

    res.json({
      message: 'Reporte actualizado exitosamente',
      report
    });
  } catch (error) {
    console.error('Error actualizando reporte:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ========== ELIMINAR REPORTE ==========

const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRol = req.user.rol;

    // Obtener reporte
    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({
        error: 'Reporte no encontrado',
        message: 'El reporte que intentas eliminar no existe'
      });
    }

    // Verificar permisos
    if (userRol === 'fisio' && report.fisio_id !== userId) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo el fisioterapeuta que creó este reporte puede eliminarlo'
      });
    }

    if (userRol === 'paciente') {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Los pacientes no pueden eliminar reportes'
      });
    }

    await report.destroy();

    res.json({ message: 'Reporte eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando reporte:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ========== ELIMINAR USUARIO ==========

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userRol = req.user.rol;

    // Solo admin puede eliminar usuarios
    if (userRol !== 'admin') {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo administradores pueden eliminar usuarios'
      });
    }

    // Obtener usuario
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'El usuario que intentas eliminar no existe'
      });
    }

    // No permitir eliminar al último admin
    if (user.rol === 'admin') {
      const adminCount = await User.count({ where: { rol: 'admin' } });
      if (adminCount === 1) {
        return res.status(400).json({
          error: 'No se puede eliminar',
          message: 'Debe haber al menos un administrador en el sistema'
        });
      }
    }

    await user.destroy();

    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ========== OBTENER CITAS DEL MES (PARA CALENDARIO) ==========

const getMonthAppointments = async (req, res) => {
  try {
    const { year, month } = req.query;
    const userId = req.user.id;
    const userRol = req.user.rol;

    // Validar parámetros
    if (!year || !month) {
      return res.status(400).json({
        error: 'Parámetros faltantes',
        message: 'Se requiere año y mes (ej: ?year=2026&month=5)'
      });
    }

    const monthNum = parseInt(month) - 1; // month es 0-indexed en Date
    const startDate = new Date(parseInt(year), monthNum, 1);
    const endDate = new Date(parseInt(year), monthNum + 1, 0, 23, 59, 59);

    // Obtener citas del mes
    const appointments = await Appointment.findAll({
      where: {
        fecha_hora: {
          [require('sequelize').Op.between]: [startDate, endDate]
        },
        ...(userRol === 'paciente' ? { paciente_id: userId } : { fisio_id: userId })
      },
      include: [
        { model: User, as: 'paciente', attributes: ['id', 'nombre'] },
        { model: User, as: 'fisio', attributes: ['id', 'nombre'] }
      ],
      order: [['fecha_hora', 'ASC']]
    });

    res.json({ appointments });
  } catch (error) {
    console.error('Error obteniendo citas del mes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Exportamos las funciones y middlewares
module.exports = {
  getUsers,
  createUser,
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getMonthAppointments,
  getReports,
  createReport,
  updateReport,
  deleteReport,
  getConsents,
  signConsent,
  deleteUser,
  requireRole,
  verifyToken
};