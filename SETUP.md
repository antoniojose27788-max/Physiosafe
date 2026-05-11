# 🚀 Guía de Configuración Rápida - PhysioSafe

## ⚡ Inicio Rápido en 5 Minutos

### ✅ Prerequisitos Ya Instalados
- ✓ Node.js y npm
- ✓ PostgreSQL corriendo
- ✓ Dependencias de npm instaladas
- ✓ Archivo .env configurado

### 🔧 Paso 1: Crear la Base de Datos

Abre PostgreSQL y ejecuta:

```sql
CREATE DATABASE physiodb;
CREATE USER physiouser WITH PASSWORD 'SecretPassword123!';
ALTER ROLE physiouser SET client_encoding TO 'utf8';
ALTER ROLE physiouser SET default_transaction_isolation TO 'read committed';
ALTER ROLE physiouser SET default_transaction_deferrable TO on;
ALTER ROLE physiouser SET default_time_zone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE physiodb TO physiouser;
```

### 🚀 Paso 2: Iniciar el Servidor

**En Modo Desarrollo:**
```bash
cd c:\Users\abarrionuevo\Desktop\Physiosafe
npm run dev
```

Verás algo como:
```
Servidor PhysioSafe ejecutándose en http://localhost:3000
Conexión a la base de datos verificada.
Base de datos sincronizada correctamente.
```

### 🌐 Paso 3: Acceder a la Aplicación

Abre tu navegador en: **http://localhost:3000**

### 📝 Paso 4: Crear Usuarios de Prueba

#### Usuario 1: Admin
1. Click en "Registrarse"
2. Completa:
   - Nombre: `Admin PhysioSafe`
   - Email: `admin@physiosafe.es`
   - Contraseña: `Admin123!`
   - Tipo: `Administrador`
3. Click en "Registrarse"

#### Usuario 2: Fisioterapeuta
1. Click en "Registrarse"
2. Completa:
   - Nombre: `Dr. Carlos Martínez`
   - Email: `carlos.martinez@physiosafe.es`
   - Contraseña: `Fisio123!`
   - Tipo: `Fisioterapeuta`
3. Click en "Registrarse"

#### Usuario 3: Paciente
1. Click en "Registrarse"
2. Completa:
   - Nombre: `Juan García López`
   - Email: `juan.garcia@email.com`
   - Contraseña: `Paciente123!`
   - Tipo: `Paciente`
3. Click en "Registrarse"

### 🔑 Paso 5: Login

Usa cualquiera de los usuarios creados:

**Login del Admin:**
- Email: `admin@physiosafe.es`
- Contraseña: `Admin123!`

### 📊 Paso 6: Explorar el Dashboard

Una vez logueado, verás:
- ✓ Dashboard con estadísticas
- ✓ Gestión de Citas
- ✓ Calendario interactivo
- ✓ Reportes
- ✓ Consentimientos
- ✓ Gestión de Usuarios (si eres Admin)

## 🎯 Funcionalidades Clave

### Para Pacientes
- ✅ Ver mis citas próximas
- ✅ Historial de citas
- ✅ Ver reportes de tratamiento
- ✅ Aceptar consentimientos
- ✅ Actualizar mi perfil

### Para Fisioterapeutas
- ✅ Ver citas asignadas
- ✅ Crear nuevas citas
- ✅ Crear reportes de pacientes
- ✅ Seguimiento de progreso
- ✅ Visualizar calendario

### Para Administradores
- ✅ Ver todos los usuarios
- ✅ Gestionar pacientes
- ✅ Gestionar fisioterapeutas
- ✅ Estadísticas globales
- ✅ Auditoría del sistema

## 🔗 URLs Útiles

| Descripción | URL |
|------------|-----|
| Página Principal | http://localhost:3000 |
| Dashboard | http://localhost:3000/dashboard.html |
| API Base | http://localhost:3000/api |
| Health Check | http://localhost:3000 |

## 📡 Ejemplos de Uso de API

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@physiosafe.es",
    "password": "Admin123!"
  }'
```

### Obtener Token
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": "12345",
    "nombre": "Admin",
    "email": "admin@physiosafe.es",
    "rol": "admin"
  }
}
```

### Usar Token en Peticiones
```bash
curl -X GET http://localhost:3000/api/appointments \
  -H "Authorization: Bearer <token>"
```

## 🛑 Detener el Servidor

Presiona en la terminal: **Ctrl + C**

## 🔍 Verificar Logs

Todos los logs aparecen en la terminal donde ejecutaste `npm run dev`.

## 🐛 Problemas Comunes

### "Error: connect ECONNREFUSED 127.0.0.1:5432"
- ✗ PostgreSQL no está corriendo
- ✓ Inicia PostgreSQL en Services (Windows) o usa: `psql` en terminal

### "Error: database "physiodb" does not exist"
- ✗ La base de datos no fue creada
- ✓ Ejecuta el SQL de creación en PostgreSQL

### "Port 3000 already in use"
- ✗ Otro proceso usa el puerto 3000
- ✓ Cambia el puerto en `.env`: `PORT=3001`

### "Cannot find module"
- ✗ Faltan dependencias
- ✓ Ejecuta: `npm install`

## 📚 Documentación Completa

Ver [README.md](README.md) para documentación completa

## 🎓 Próximos Pasos

1. ✅ Familiarízate con el Dashboard
2. ✅ Crea varios usuarios de prueba
3. ✅ Prueba la creación de citas
4. ✅ Crea reportes
5. ✅ Explora el calendario
6. ✅ Prueba los diferentes roles

## 📞 Soporte

Si encuentras problemas:
1. Revisa la sección "Problemas Comunes"
2. Verifica los logs en la terminal
3. Consulta el README.md
4. Contacta: info@physiosafe.es

---

¡**Bienvenido a PhysioSafe!** 🏥

Tu clínica de fisioterapia digital está lista para funcionar. 🎉
