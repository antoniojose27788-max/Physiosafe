const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.register = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;
        
        const existe = await User.findOne({ where: { email } });
        if (existe) return res.status(400).json({ error: 'El email ya existe' });

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        await User.create({ nombre, email, password: hash, rol: 'paciente' });
        res.status(201).json({ message: 'Registrado correctamente' });
    } catch (error) {
        console.error("❌ ERROR EN REGISTRO:", error);
        res.status(500).json({ error: 'Error interno al registrar' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const usuario = await User.findOne({ where: { email } });

        if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id: usuario.id, rol: usuario.rol, nombre: usuario.nombre },
            process.env.JWT_SECRET || 'MiClaveSuperSecretaTFG2026',
            { expiresIn: '24h' }
        );

        res.json({ token, rol: usuario.rol, nombre: usuario.nombre });
    } catch (error) {
        console.error("❌ ERROR EN LOGIN:", error);
        res.status(500).json({ error: 'Error interno en el login' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, { attributes: ['nombre', 'rol', 'email'] });
        res.json(user);
    } catch (e) { res.status(500).json({ error: 'Error al obtener usuario' }); }
};