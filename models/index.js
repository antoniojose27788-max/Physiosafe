// models/index.js
// Archivo central para importar modelos y definir asociaciones

// Importamos la configuración de la base de datos
const { sequelize } = require('../config/db');

// Importamos todos los modelos
const User = require('./User');
const Appointment = require('./Appointment');
const Report = require('./Report');
const Consent = require('./Consent');

// Definimos las asociaciones entre modelos

// Un User puede tener muchas Appointments como paciente
User.hasMany(Appointment, { foreignKey: 'paciente_id', as: 'appointmentsAsPaciente' });
// Un User puede tener muchas Appointments como fisioterapeuta
User.hasMany(Appointment, { foreignKey: 'fisio_id', as: 'appointmentsAsFisio' });
// Una Appointment pertenece a un paciente (User)
Appointment.belongsTo(User, { foreignKey: 'paciente_id', as: 'paciente' });
// Una Appointment pertenece a un fisioterapeuta (User)
Appointment.belongsTo(User, { foreignKey: 'fisio_id', as: 'fisio' });

// Un User puede tener muchos Reports como paciente
User.hasMany(Report, { foreignKey: 'paciente_id', as: 'reportsAsPaciente' });
// Un User puede tener muchos Reports como fisioterapeuta
User.hasMany(Report, { foreignKey: 'fisio_id', as: 'reportsAsFisio' });
// Un Report pertenece a un paciente (User)
Report.belongsTo(User, { foreignKey: 'paciente_id', as: 'paciente' });
// Un Report pertenece a un fisioterapeuta (User)
Report.belongsTo(User, { foreignKey: 'fisio_id', as: 'fisio' });

// Un User puede tener muchos Consents
User.hasMany(Consent, { foreignKey: 'user_id', as: 'consents' });
// Un Consent pertenece a un User (paciente)
Consent.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Función para sincronizar la base de datos (crear tablas si no existen)
// Solo para desarrollo; en producción, usar migraciones
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true }); // Alter modifica tablas existentes si es necesario
    console.log('Base de datos sincronizada correctamente.');
  } catch (error) {
    console.error('Error al sincronizar la base de datos:', error);
  }
};

// Exportamos los modelos y funciones útiles
module.exports = {
  sequelize,
  User,
  Appointment,
  Report,
  Consent,
  syncDatabase
};