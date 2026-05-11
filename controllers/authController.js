// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.register = async (req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;

        const usuarioExistente = await User.findOne({ where: { email } });
        if (usuarioExistente) return res.status(400).json({ error: 'El email ya está registrado' });

        const salt = await bcrypt.genSalt(10);
        const passwordHasheada = await bcrypt.hash(password, salt);

        const nuevoUsuario = await User.create({
            nombre,
            email,
            password: passwordHasheada,
            rol: rol || 'paciente'
        });

        const token = jwt.sign(
            { id: nuevoUsuario.id, rol: nuevoUsuario.rol, nombre: nuevoUsuario.nombre },
            process.env.JWT_SECRET || 'MiClaveSuperSecretaTFG2026',
            { expiresIn: '24h' }
        );

        res.status(201).json({ message: 'Registrado', token });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor al registrar' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const usuario = await User.findOne({ where: { email } });
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

        const passwordValida = await bcrypt.compare(password, usuario.password);
        if (!passwordValida) return res.status(401).json({ error: 'Contraseña incorrecta' });

        const token = jwt.sign(
            { id: usuario.id, rol: usuario.rol, nombre: usuario.nombre },
            process.env.JWT_SECRET || 'MiClaveSuperSecretaTFG2026',
            { expiresIn: '24h' }
        );

        res.status(200).json({ message: 'Login exitoso', token });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor al iniciar sesión' });
    }
};

// LA FUNCIÓN QUE FALTABA Y ROMPÍA EL SERVIDOR
exports.getMe = async (req, res) => {
    try {
        const usuario = await User.findByPk(req.user.id, {
            attributes: ['id', 'nombre', 'email', 'rol'] // No enviamos la contraseña
        });

        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

        res.status(200).json(usuario);
    } catch (error) {
        console.error('Error en /me:', error);
        res.status(500).json({ error: 'Error al obtener los datos del usuario' });
    }
};