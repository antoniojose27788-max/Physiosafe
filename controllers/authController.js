// controllers/authController.js
// Controlador de autenticación

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Registrar un nuevo usuario
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;
        
        // Validar que los campos requeridos estén presentes
        if (!nombre || !email || !password) {
            return res.status(400).json({ 
                error: 'Los campos nombre, email y password son requeridos' 
            });
        }
        
        // Verificar si el email ya existe
        const existe = await User.findOne({ where: { email } });
        if (existe) {
            return res.status(400).json({ 
                error: 'El email ya está registrado' 
            });
        }

        // Hashear la contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHasheada = await bcrypt.hash(password, salt);

        // Crear el nuevo usuario
        const nuevoUsuario = await User.create({
            nombre,
            email,
            password: passwordHasheada,
            rol: rol || 'paciente'
        });

        res.status(201).json({ 
            message: 'Usuario creado exitosamente',
            usuario: {
                id: nuevoUsuario.id,
                nombre: nuevoUsuario.nombre,
                email: nuevoUsuario.email,
                rol: nuevoUsuario.rol
            }
        });
    } catch (error) {
        console.error("Error en registro:", error); 
        res.status(500).json({ 
            error: 'Error al registrar el usuario',
            detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Iniciar sesión
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar campos requeridos
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email y contraseña son requeridos' 
            });
        }

        // Buscar el usuario por email
        const usuario = await User.findOne({ where: { email } });
        if (!usuario) {
            return res.status(404).json({ 
                error: 'Usuario no encontrado' 
            });
        }

        // Comparar contraseñas
        const esValida = await bcrypt.compare(password, usuario.password);
        if (!esValida) {
            return res.status(401).json({ 
                error: 'Contraseña incorrecta' 
            });
        }

        // Generar JWT token
        const token = jwt.sign(
            { 
                id: usuario.id, 
                rol: usuario.rol, 
                nombre: usuario.nombre,
                email: usuario.email
            },
            process.env.JWT_SECRET || 'MiClaveSuperSecretaTFG2026',
            { expiresIn: '24h' }
            { expiresIn: '24h' }
        );

        res.status(200).json({ 
            token, 
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }
        });
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ 
            error: 'Error al iniciar sesión',
            detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Obtener datos del usuario autenticado
 * GET /api/auth/me
 * Requiere autenticación (token JWT)
 */
exports.getMe = async (req, res) => {
    try {
        const usuario = await User.findByPk(req.user.id, { 
            attributes: ['id', 'nombre', 'email', 'rol', 'createdAt']
        });
        
        if (!usuario) {
            return res.status(404).json({ 
                error: 'Usuario no encontrado' 
            });
        }
        
        res.json(usuario);
    } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
        res.status(500).json({ 
            error: 'Error al obtener datos del usuario',
            detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Logout (generalmente solo borra el token en el cliente)
 * POST /api/auth/logout
 * Requiere autenticación
 */
exports.logout = async (req, res) => {
    try {
        // En una arquitectura sin sesiones (JWT), el logout se maneja en el cliente
        // Solo confirmamos que el logout fue procesado
        res.json({ 
            message: 'Sesión cerrada exitosamente' 
        });
    } catch (error) {
        console.error("Error en logout:", error);
        res.status(500).json({ 
            error: 'Error al cerrar sesión' 
        });
    }
};

/**
 * Actualizar datos del usuario
 * PUT /api/auth/update
 * Requiere autenticación
 */
exports.updateUser = async (req, res) => {
    try {
        const { nombre, email } = req.body;
        const usuarioId = req.user.id;

        // Verificar que el usuario no cambie a un email que ya existe
        if (email) {
            const emailExistente = await User.findOne({ 
                where: { email, id: { [require('sequelize').Op.ne]: usuarioId } }
            });
            if (emailExistente) {
                return res.status(400).json({ 
                    error: 'El email ya está en uso' 
                });
            }
        }

        // Actualizar usuario
        const usuario = await User.findByPk(usuarioId);
        if (!usuario) {
            return res.status(404).json({ 
                error: 'Usuario no encontrado' 
            });
        }

        if (nombre) usuario.nombre = nombre;
        if (email) usuario.email = email;
        
        await usuario.save();

        res.json({ 
            message: 'Usuario actualizado exitosamente',
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }
        });
    } catch (error) {
        console.error("Error al actualizar usuario:", error);
        res.status(500).json({ 
            error: 'Error al actualizar el usuario',
            detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
