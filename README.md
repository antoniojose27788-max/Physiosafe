# PhysioSafe - Sistema de Gestión de Clínica de Fisioterapia

## 📋 Descripción

PhysioSafe es una aplicación web moderna y completa para la gestión integral de una clínica de fisioterapia. Permite a pacientes y fisioterapeutas interactuar en un sistema diseñado con tecnología de punta, garantizando eficiencia, seguridad y experiencia de usuario excepcional.

## ✨ Características Principales

### 👤 Autenticación y Roles
- Registro y login seguro con JWT
- Tres roles: Admin, Fisioterapeuta y Paciente
- Tokens con expiración automática
- Contraseñas encriptadas con bcrypt

### 📅 Gestión de Citas
- Crear, editar y eliminar citas
- Calendario interactivo
- Prevención de conflictos de horarios
- Historial de citas completado/pendiente

### 📊 Dashboard Personalizado
- Estadísticas en tiempo real
- Vista general de citas y reportes
- Notificaciones de eventos

### 📄 Reportes
- Crear reportes de tratamiento
- Adjuntar documentos/imágenes
- Seguimiento de progreso
- Acceso según permisos

### ✓ Consentimientos
- Registro de consentimientos informados
- Aceptación de términos
- Historial de firmas

### 👥 Gestión de Usuarios (Admin)
- Crear, editar y eliminar usuarios
- Asignación de roles
- Visualización de estadísticas

### 🎨 Interfaz Moderna
- Bootstrap 5 responsive
- Diseño elegante y profesional
- Transiciones suaves
- Optimizado para móvil

## 🛠️ Stack Tecnológico

### Backend
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **PostgreSQL** - Base de datos
- **Sequelize** - ORM para SQL
- **JWT** - Autenticación segura
- **bcrypt** - Encriptación de contraseñas

### Frontend
- **HTML5** - Estructura
- **CSS3** - Estilos avanzados
- **Bootstrap 5** - Framework CSS
- **JavaScript Vanilla** - Lógica cliente
- **FontAwesome** - Iconografía

## 📦 Instalación

### Prerequisitos
- Node.js (v14 o superior)
- PostgreSQL (v12 o superior)
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <url-repositorio>
cd Physiosafe
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Editar el archivo `.env`:
```env
# Base de Datos
DATABASE_URL=postgresql://physiouser:SecretPassword123!@localhost:5432/physiodb
DB_HOST=localhost
DB_PORT=5432
DB_NAME=physiodb
DB_USER=physiouser
DB_PASSWORD=SecretPassword123!

# Servidor
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=MiClaveSuperSecretaTFG2026

# Frontend
FRONTEND_URL=http://localhost:3000

# Encriptación
ENCRYPTION_SECRET=ClaveSuperSecretaPhysioSafe2026!
```

4. **Configurar Base de Datos**

Crear la base de datos en PostgreSQL:
```sql
CREATE DATABASE physiodb;
CREATE USER physiouser WITH PASSWORD 'SecretPassword123!';
ALTER ROLE physiouser SET client_encoding TO 'utf8';
ALTER ROLE physiouser SET default_transaction_isolation TO 'read committed';
ALTER ROLE physiouser SET default_transaction_deferrable TO on;
ALTER ROLE physiouser SET default_time_zone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE physiodb TO physiouser;
```

5. **Iniciar la aplicación**

Modo desarrollo:
```bash
npm run dev
```

Modo producción:
```bash
npm start
```

La aplicación estará disponible en: **http://localhost:3000**

## 🗂️ Estructura de Carpetas

```
Physiosafe/
├── app/                    # Archivos de configuración
├── config/
│   └── db.js              # Configuración de base de datos
├── controllers/
│   ├── authController.js  # Lógica de autenticación
│   └── apiController.js   # Lógica de API
├── models/
│   ├── index.js           # Exportación de modelos
│   ├── User.js            # Modelo de usuario
│   ├── Appointment.js     # Modelo de cita
│   ├── Report.js          # Modelo de reporte
│   └── Consent.js         # Modelo de consentimiento
├── routes/
│   ├── authRoutes.js      # Rutas de autenticación
│   └── apiRoutes.js       # Rutas de API
├── middlewares/
│   └── authMiddleware.js  # Middleware de autenticación
├── public/
│   ├── index.html         # Página principal
│   ├── dashboard.html     # Dashboard
│   ├── app.js             # Lógica frontend
│   ├── dashboard.js       # Lógica dashboard
│   └── style.css          # Estilos
├── server.js              # Servidor principal
├── package.json           # Dependencias
├── .env                   # Variables de entorno
└── README.md              # Este archivo
```

## 🔐 Seguridad

- ✅ Contraseñas encriptadas con bcrypt
- ✅ Autenticación por JWT
- ✅ CORS configurado
- ✅ Validación de entrada
- ✅ Protección de rutas
- ✅ Headers de seguridad
- ✅ Límite de tamaño de payload

## 📡 API Endpoints

### Autenticación
```
POST   /api/auth/register     - Registrar usuario
POST   /api/auth/login        - Iniciar sesión
GET    /api/auth/me           - Obtener usuario actual
POST   /api/auth/logout       - Cerrar sesión
PUT    /api/auth/update       - Actualizar usuario
```

### Citas
```
GET    /api/appointments      - Listar citas
POST   /api/appointments      - Crear cita
PUT    /api/appointments/:id  - Actualizar cita
DELETE /api/appointments/:id  - Eliminar cita
```

### Reportes
```
GET    /api/reports           - Listar reportes
POST   /api/reports           - Crear reporte
GET    /api/reports/:id       - Obtener reporte
```

### Consentimientos
```
GET    /api/consents          - Listar consentimientos
POST   /api/consents          - Crear consentimiento
```

### Estadísticas
```
GET    /api/stats             - Obtener estadísticas
GET    /api/users             - Listar usuarios (admin)
GET    /api/users/:id         - Obtener usuario
```

## 🧪 Pruebas

### Usuarios de Prueba

**Admin**
- Email: admin@physiosafe.es
- Contraseña: Admin123!

**Fisioterapeuta**
- Email: fisio@physiosafe.es
- Contraseña: Fisio123!

**Paciente**
- Email: paciente@physiosafe.es
- Contraseña: Paciente123!

## 🚀 Despliegue

### Con Docker Compose
```bash
docker-compose up -d
```

### En Producción
```bash
# Instalar dependencias de producción
npm install --production

# Iniciar con PM2
npm install -g pm2
pm2 start server.js --name "physiosafe"
pm2 save
pm2 startup
```

## 📝 Variables de Entorno

| Variable | Descripción | Valor Defecto |
|----------|-------------|---------------|
| `DATABASE_URL` | URL de conexión PostgreSQL | `postgresql://...` |
| `PORT` | Puerto del servidor | `3000` |
| `NODE_ENV` | Ambiente (development/production) | `development` |
| `JWT_SECRET` | Clave secreta para JWT | `MiClaveSuperSecretaTFG2026` |
| `FRONTEND_URL` | URL del frontend | `http://localhost:3000` |

## 🐛 Troubleshooting

### Error de conexión a BD
- Verificar que PostgreSQL está corriendo
- Verificar credenciales en .env
- Verificar que la base de datos existe

### Puerto en uso
```bash
# Cambiar puerto en .env o usar:
PORT=3001 npm start
```

### Node modules corrupto
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📞 Soporte

Para reportar problemas o sugerencias, contacta con:
- Email: info@physiosafe.es
- Teléfono: +34 912 345 678

## 📄 Licencia

Este proyecto está bajo licencia ISC.

## 👨‍💼 Autor

Desarrollado como solución profesional para gestión de clínicas de fisioterapia.

---

**PhysioSafe v1.0.0** - Tu salud, nuestra prioridad ❤️
