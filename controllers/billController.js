const { Bill, User } = require('../models');

exports.getBills = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.rol;

        let whereClause = {};
        if (userRole === 'paciente') {
            whereClause.paciente_id = userId;
        }

        const bills = await Bill.findAll({
            where: whereClause,
            include: [{ model: User, as: 'paciente', attributes: ['id', 'nombre', 'email'] }],
            order: [['fecha_emision', 'DESC']]
        });

        res.json(bills);
    } catch (error) {
        console.error('Error al obtener facturas:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener facturas.' });
    }
};

exports.createBill = async (req, res) => {
    try {
        if (req.user.rol === 'paciente') {
             return res.status(403).json({ error: 'No tienes permiso para crear facturas.' });
        }
        const { paciente_id, monto, estado } = req.body;
        const nuevaFactura = await Bill.create({
            paciente_id,
            monto,
            estado: estado || 'pendiente'
        });
        res.status(201).json(nuevaFactura);
    } catch (error) {
         console.error('Error al crear factura:', error);
         res.status(500).json({ error: 'Error interno del servidor al crear factura.' });
    }
};

exports.updateBillStatus = async (req, res) => {
    try {
        if (req.user.rol === 'paciente') {
             return res.status(403).json({ error: 'No tienes permiso para actualizar facturas.' });
        }
        const { id } = req.params;
        const { estado } = req.body;

        const bill = await Bill.findByPk(id);
        if (!bill) {
            return res.status(404).json({ error: 'Factura no encontrada.' });
        }

        bill.estado = estado;
        await bill.save();
        res.json(bill);
    } catch (error) {
        console.error('Error al actualizar factura:', error);
        res.status(500).json({ error: 'Error interno del servidor al actualizar factura.' });
    }
};
