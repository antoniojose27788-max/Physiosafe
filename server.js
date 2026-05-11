const express = require('express');
const cors = require('cors');
const { syncDatabase } = require('./models');
require('dotenv').config();

const app = express();

// Middlewares básicos
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Enlace de rutas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api', require('./routes/apiRoutes'));

const PORT = process.env.PORT || 3000;

// Arrancar base de datos y luego el servidor
syncDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 PhysioSafe funcionando en: http://localhost:${PORT}`);
    });
});