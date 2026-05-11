const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Acceso denegado. No hay token.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'MiClaveSuperSecretaTFG2026');
        req.user = decoded; // Guardamos los datos del usuario en la petición
        next();
    } catch (error) {
        res.status(403).json({ error: 'Token inválido o caducado.' });
    }
};