const { Record, User } = require('../models');

exports.getRecords = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.rol;

        let whereClause = {};
        if (userRole === 'paciente') {
            whereClause.paciente_id = userId;
        }

        const records = await Record.findAll({
            where: whereClause,
            include: [
                { model: User, as: 'paciente', attributes: ['id', 'nombre', 'email'] },
                { model: User, as: 'fisio', attributes: ['id', 'nombre'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(records);
    } catch (error) {
        console.error('Error al obtener expedientes:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener expedientes.' });
    }
};

exports.createRecord = async (req, res) => {
    try {
        if (req.user.rol === 'paciente') {
             return res.status(403).json({ error: 'No tienes permiso para crear expedientes.' });
        }
        const { paciente_id, diagnostico, tratamiento, evolucion } = req.body;
        const fisio_id = req.user.id;

        const nuevoRecord = await Record.create({
            paciente_id,
            fisio_id,
            diagnostico,
            tratamiento,
            evolucion
        });
        res.status(201).json(nuevoRecord);
    } catch (error) {
         console.error('Error al crear expediente:', error);
         res.status(500).json({ error: 'Error interno del servidor al crear expediente.' });
    }
};
