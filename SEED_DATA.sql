-- ============================================================
-- Script de Prueba - PhysioSafe
-- Crear usuarios de prueba y datos iniciales
-- ============================================================

-- Nota: Ejecutar esto manualmente en PostgreSQL después de que
-- la aplicación haya sincronizado los esquemas

-- Los usuarios se crearán automáticamente mediante la aplicación
-- pero aquí están los pasos para hacerlo manualmente:

-- 1. Registrar un Admin:
-- POST http://localhost:3000/api/auth/register
-- {
--   "nombre": "Admin PhysioSafe",
--   "email": "admin@physiosafe.es",
--   "password": "Admin123!",
--   "rol": "admin"
-- }

-- 2. Registrar un Fisioterapeuta:
-- POST http://localhost:3000/api/auth/register
-- {
--   "nombre": "Dr. Carlos Martínez",
--   "email": "carlos.martinez@physiosafe.es",
--   "password": "Fisio123!",
--   "rol": "fisio"
-- }

-- 3. Registrar un Paciente:
-- POST http://localhost:3000/api/auth/register
-- {
--   "nombre": "Juan García López",
--   "email": "juan.garcia@email.com",
--   "password": "Paciente123!",
--   "rol": "paciente"
-- }

-- 4. Registrar otro Paciente:
-- POST http://localhost:3000/api/auth/register
-- {
--   "nombre": "María López González",
--   "email": "maria.lopez@email.com",
--   "password": "Paciente123!",
--   "rol": "paciente"
-- }

-- 5. Registrar otro Fisioterapeuta:
-- POST http://localhost:3000/api/auth/register
-- {
--   "nombre": "Dra. Ana Rodríguez",
--   "email": "ana.rodriguez@physiosafe.es",
--   "password": "Fisio123!",
--   "rol": "fisio"
-- }

-- Después de crear los usuarios, puedes:
-- - Obtener sus IDs desde las respuestas de registro
-- - Usar esos IDs para crear citas
-- - Crear reportes y consentimientos

-- Ejemplo de crear una cita:
-- POST http://localhost:3000/api/appointments
-- Headers: Authorization: Bearer <token>
-- {
--   "fecha_hora": "2026-05-20T10:30:00Z",
--   "paciente_id": "<id-paciente>",
--   "fisio_id": "<id-fisioterapeuta>"
-- }
