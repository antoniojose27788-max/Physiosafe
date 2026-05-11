// controllers/authController.js
// Controlador para manejar la lógica de autenticación

const bcrypt = require('bcrypt'); // Para hashear contraseñas
const jwt = require('jsonwebtoken'); // Para generar y verificar tokens JWT
const { User } = require('../models'); // Importamos el modelo User

// Función para registrar un nuevo usuario
const register = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    // Validamos que todos los campos requeridos estén presentes
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({
        error: 'Campos requeridos faltantes',
        message: 'Nombre, email, password y rol son obligatorios'
      });
    }

    // Validamos que el rol sea válido
    const rolesValidos = ['admin', 'fisio', 'paciente'];
    if (!rolesValidos.includes(rol)) {
      return res.status(400).json({
        error: 'Rol inválido',
        message: 'El rol debe ser admin, fisio o paciente'
      });
    }

    // Verificamos si el email ya existe
    const usuarioExistente = await User.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(409).json({
        error: 'Email ya registrado',
        message: 'Ya existe un usuario con este email'
      });
    }

    // Hasheamos la contraseña antes de guardarla
    const saltRounds = 10; // Número de rondas para el hashing
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Creamos el nuevo usuario en la base de datos
    const nuevoUsuario = await User.create({
      nombre,
      email,
      password: hashedPassword,
      rol
    });

    // Generamos un token JWT para el nuevo usuario
    const token = jwt.sign(
      { id: nuevoUsuario.id, email: nuevoUsuario.email, rol: nuevoUsuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // El token expira en 24 horas
    );

    // Respondemos con éxito, sin incluir la contraseña
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol
      },
      token
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo registrar el usuario'
    });
  }
};

// Función para iniciar sesión
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validamos que email y password estén presentes
    if (!email || !password) {
      return res.status(400).json({
        error: 'Campos requeridos faltantes',
        message: 'Email y password son obligatorios'
      });
    }

    // Buscamos al usuario por email
    const usuario = await User.findOne({ where: { email } });
    if (!usuario) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Verificamos la contraseña hasheada
    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Generamos un token JWT
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Respondemos con éxito
    res.json({
      message: 'Inicio de sesión exitoso',
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      },
      token
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo iniciar sesión'
    });
  }
};

// Middleware para verificar tokens JWT en rutas protegidas
const verifyToken = (req, res, next) => {
  try {
    // Obtenemos el token del header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token faltante',
        message: 'Se requiere un token de autenticación'
      });
    }

    const token = authHeader.substring(7); // Removemos 'Bearer '

    // Verificamos el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Agregamos la información del usuario al request
    req.user = decoded;
    next(); // Continuamos con la siguiente función
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        message: 'El token ha expirado, inicia sesión nuevamente'
      });
    }
    return res.status(401).json({
      error: 'Token inválido',
      message: 'Token de autenticación inválido'
    });
  }
};

// Función para verificar el token (ruta GET /api/auth/verify)
const verify = (req, res) => {
  // Si llega aquí, el token ya fue verificado por el middleware
  res.json({
    message: 'Token válido',
    user: req.user
  });
};

// Exportamos las funciones para usarlas en las rutas
module.exports = {
  register,
  login,
  verifyToken,
  verify
};