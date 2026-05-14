# PhysioSafe - Sistema de Gestión de Clínica SaaS & 3D Creator Theme

## 📋 Descripción

PhysioSafe es una aplicación web moderna y completa para la gestión integral de una clínica de fisioterapia. Se ha rediseñado estéticamente como un landing page estilo "3D Creator" usando tecnologías front-end avanzadas y animaciones, apoyado en un backend robusto que ahora actúa como un **Software as a Service (SaaS)** completo, integrando Expedientes Clínicos y Facturación.

Permite a pacientes y fisioterapeutas interactuar en un sistema diseñado con tecnología de punta, garantizando eficiencia, seguridad y una experiencia de usuario excepcional.

## ✨ Características Principales

### 👤 Autenticación y Roles Avanzados
- Registro y login seguro con JWT.
- Tres roles: **Admin, Fisioterapeuta y Paciente**.
- Visibilidad restringida:
  - Los pacientes solo ven sus propias facturas, citas y expedientes médicos.
  - Los administradores y fisioterapeutas tienen acceso global para gestionar toda la clínica.

### 📅 Gestión de Citas
- Crear, editar y eliminar citas.
- Calendario interactivo usando FullCalendar.
- Prevención de conflictos de horarios.
- Historial de citas completado/pendiente.

### 📂 Expedientes Clínicos Digitales
- Control y almacenamiento de historias clínicas de pacientes.
- Registro de diagnósticos, tratamientos y evoluciones.
- Acceso reservado a fisioterapeutas y administradores para edición.

### 💳 Facturación y Pagos
- Generación de facturas para los pacientes.
- Registro del estado de pago (Pendiente/Pagado) y montos.
- Integración en el panel de métricas con el cálculo de **Ingresos Totales**.

### 📊 Dashboard Premium SaaS
- Estadísticas y KPIs en tiempo real.
- Vista general de citas, reportes, facturación y dinero ingresado.
- Navegación por pestañas tipo Single Page Application (SPA).

### 🎨 Landing Page "3D Creator"
- Diseño ultra-moderno adaptado del prototipo *3D Creator Portfolio*.
- Fondo oscuro `#0C0C0C` y tipografía `Kanit`.
- Secciones animadas (Hero, About, Services, Projects) usando **Framer Motion** y **React**.
- Transiciones magnéticas interactivas en imágenes y botones con degradados premium.

## 🛠️ Stack Tecnológico

### Backend
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **PostgreSQL** - Base de datos (v15)
- **Sequelize** - ORM para SQL
- **JWT** - Autenticación segura
- **bcrypt** - Encriptación de contraseñas

### Frontend
- **HTML5** & **CSS3**
- **React (Standalone vía Babel)** - Arquitectura de la nueva Landing Page.
- **Tailwind CSS (CDN)** - Estilos y diseño responsivo ultra-rápido.
- **Framer Motion** - Animaciones profesionales y scroll effects.
- **Bootstrap 5** - Sistema del Dashboard.
- **JavaScript Vanilla** - Lógica del Dashboard y Auth Modal.

### Infraestructura (Dockerizada)
- Configuración con `docker-compose.yml`.
- Entorno de Base de Datos, App, y Typebot en una red cerrada (`physio-network`).
- Conexión segura usando Cloudflared y Nginx.

## 📦 Instalación y Configuración

### Prerequisitos
- Node.js (v18 o superior)
- Docker y Docker Compose
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <url-repositorio>
cd Physiosafe
```

2. **Instalar dependencias locales**
```bash
npm install
```

3. **Configurar variables de entorno**

Crea y edita el archivo `.env` en la raíz (usa las credenciales seguras proporcionadas por tu administrador):
```env
# Base de Datos
DB_HOST=db
DB_PORT=5432
DB_NAME=physiodb
DB_USER=physiouser
DB_PASSWORD=SecurePassword123!

# URL Compuesta (Ejemplo)
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@db:${DB_PORT}/${DB_NAME}

# Servidor y JWT
PORT=3000
NODE_ENV=production
JWT_SECRET=MiClaveSuperSecreta
ENCRYPTION_SECRET=ClaveSuperSecretaPhysioSafe
FRONTEND_URL=http://localhost:3000
```

4. **Despliegue con Docker (Recomendado)**

```bash
docker-compose up -d
```
Esto inicializará automáticamente PostgreSQL, Node.js (App) y todos los servicios extra asociados al contenedor.
La aplicación estará disponible en: **http://localhost:3000**

*(La base de datos se sincronizará automáticamente creando las tablas de Bills, Records, Users, etc. en el primer inicio gracias a Sequelize `sync`).*

## 🗂️ Estructura de Carpetas

```
Physiosafe/
├── config/
│   └── db.js              # Configuración de PostgreSQL
├── controllers/
│   ├── authController.js  # Lógica de autenticación
│   ├── apiController.js   # Gestión de Citas, Usuarios y Stats
│   ├── billController.js  # Control de Facturación
│   └── recordController.js# Control de Expedientes Clínicos
├── models/
│   ├── index.js           # Relaciones y Sync de BD
│   ├── User.js            # Modelo de usuario
│   ├── Appointment.js     # Modelo de cita
│   ├── Bill.js            # Modelo de Facturación
│   ├── Record.js          # Modelo de Expediente Médico
│   └── ...
├── routes/
│   ├── authRoutes.js      # Endpoints: /api/auth
│   └── apiRoutes.js       # Endpoints protegidos: /api/...
├── middlewares/
│   └── authMiddleware.js  # Protector JWT
├── public/
│   ├── index.html         # Landing Page (React + Tailwind + FramerMotion)
│   ├── dashboard.html     # Panel de Control SaaS (Bootstrap)
│   ├── app.js             # Lógica de Login/Register
│   ├── dashboard.js       # SPA y API fetch del Dashboard
│   └── style.css          # Estilos adicionales
├── docker-compose.yml     # Infraestructura Docker
├── Dockerfile             # Configuración imagen Node 18
├── server.js              # Entrypoint de la API
└── package.json           # Dependencias NPM
```

## 📡 API Endpoints Nuevos

Adicional a las rutas de `/api/auth` y `/api/appointments`:

### Facturas (Bills) - *Protegido para Fisios/Admins*
- `GET /api/bills` - Obtener facturas (Pacientes ven las suyas, Fisios ven todas)
- `POST /api/bills` - Crear factura
- `PUT /api/bills/:id` - Actualizar estado de factura (Ej. 'pagado')

### Expedientes Clínicos (Records) - *Protegido para Fisios/Admins*
- `GET /api/records` - Obtener todos los expedientes (filtro automático por rol)
- `POST /api/records` - Crear nuevo expediente médico (diagnóstico, tratamiento, evolución)

## 🐛 Troubleshooting

### No carga el Landing Page
- Asegúrate de tener conexión a internet; la nueva interfaz descarga React, Babel, Framer Motion y Tailwind mediante CDN (Unpkg/JSDelivr).

### La base de datos no conecta
- Revisa el estado del contenedor `db` con `docker ps`.
- Verifica que el `DATABASE_URL` o las variables `DB_*` en `.env` correspondan.

---

**PhysioSafe v2.0 SaaS** - Recuperando el futuro con la mejor tecnología médica y digital.
