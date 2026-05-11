// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // 1. Buscamos el token en la cabecera de la petición
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
        return res.status(401).json({ error: 'Acceso denegado. No hay token.' });
    }

    try {
        // 2. Extraemos el token (quitando la palabra "Bearer ")
        const token = authHeader.replace('Bearer ', '');
        
        // 3. Verificamos que sea válido y no haya caducado
        const verificado = jwt.verify(token, process.env.JWT_SECRET || 'MiClaveSuperSecretaTFG2026');
        
        // 4. Guardamos los datos del usuario (id, rol) en la petición y le dejamos pasar
        req.user = verificado;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Token no válido o caducado.' });
    }
};