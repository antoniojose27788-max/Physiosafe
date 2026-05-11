# PhysioSafe - Gestión de Clínica de Fisioterapia

Aplicación web completa para la gestión de una clínica de fisioterapia, desarrollada con Node.js, Express, PostgreSQL y Vanilla JavaScript.

## 🚀 Características

- **Autenticación JWT**: Sistema seguro de login y registro con tokens JWT
- **Gestión de Usuarios**: Roles de administrador, fisioterapeuta y paciente
- **Citas Médicas**: Programación y seguimiento de citas
- **Reportes**: Documentación de tratamientos y evoluciones
- **Consentimientos**: Gestión de consentimientos informados
- **Interfaz Moderna**: Frontend responsive con diseño profesional

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Entorno de ejecución
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos
- **Sequelize** - ORM para base de datos
- **JWT** - Autenticación con tokens
- **bcrypt** - Hashing de contraseñas

### Frontend
- **HTML5** - Estructura
- **CSS3** - Estilos y diseño responsive
- **Vanilla JavaScript** - Lógica del cliente

## 📋 Prerrequisitos

- Node.js (versión 16 o superior)
- Docker y Docker Compose
- PostgreSQL (opcional, se incluye en Docker)

## 🔧 Instalación

1. **Clona el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd physiosafe
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Configura la base de datos**
   - Instala Docker Desktop
   - Ejecuta: `docker-compose up -d`
   - La base de datos estará disponible en `localhost:5432`

4. **Configura las variables de entorno**
   - Edita el archivo `.env` si es necesario
   - Las variables por defecto están configuradas para desarrollo local

5. **Inicia el servidor**
   ```bash
   npm start
   ```

6. **Accede a la aplicación**
   - Abre tu navegador en `http://localhost:3000`
   - Registra un usuario administrador para comenzar

## 📊 Estructura del Proyecto

```
physiosafe/
├── config/
│   └── db.js              # Configuración de la base de datos
├── models/
│   ├── index.js          # Definición de modelos y asociaciones
│   ├── User.js           # Modelo de Usuario
│   ├── Appointment.js    # Modelo de Cita
│   ├── Report.js         # Modelo de Reporte
│   └── Consent.js        # Modelo de Consentimiento
├── controllers/
│   ├── authController.js # Lógica de autenticación
│   └── apiController.js  # Lógica de la API
├── routes/
│   ├── authRoutes.js     # Rutas de autenticación
│   └── apiRoutes.js      # Rutas de la API
├── public/
│   ├── index.html        # Página de login/registro
│   ├── dashboard.html    # Panel principal
│   ├── style.css         # Estilos CSS
│   ├── app.js            # Lógica general del frontend
│   └── dashboard.js      # Lógica del dashboard
├── server.js             # Archivo principal del servidor
├── package.json          # Dependencias y scripts
├── docker-compose.yml    # Configuración de Docker
└── .env                  # Variables de entorno
```

## 🔐 Roles de Usuario

- **Administrador**: Acceso completo a todas las funciones, gestión de usuarios
- **Fisioterapeuta**: Gestión de citas, reportes y pacientes asignados
- **Paciente**: Visualización de sus citas, reportes y consentimientos

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/verify` - Verificación de token

### API General (requiere autenticación)
- `GET /api/users` - Lista de usuarios (admin)
- `POST /api/users` - Crear usuario (admin)
- `GET /api/appointments` - Citas del usuario
- `POST /api/appointments` - Crear cita
- `GET /api/reports` - Reportes del usuario
- `POST /api/reports` - Crear reporte
- `GET /api/consents` - Consentimientos del usuario
- `POST /api/consents` - Firmar consentimiento

## 🧪 Desarrollo

Para desarrollo con recarga automática:
```bash
npm run dev
```

## 📝 Notas de Producción

- Cambia el `JWT_SECRET` en producción
- Configura `NODE_ENV=production`
- Usa HTTPS en producción
- Configura CORS para el dominio de producción
- Implementa rate limiting para la API

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Soporte

Para soporte, crea un issue en el repositorio o contacta al equipo de desarrollo.