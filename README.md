# EcoMarketplace - Backend API

Backend REST API para el marketplace de desechos industriales EcoMarketplace.

## 🚀 Características

- Autenticación con JWT
- Gestión de usuarios y empresas
- CRUD de desechos/materias primas
- Sistema de favoritos
- Dashboard con estadísticas
- Base de datos SQL Server

## 📋 Requisitos Previos

- Node.js 14 o superior
- SQL Server (local o remoto)
- npm o yarn

## 🔧 Instalación

1. Clona el repositorio:
```bash
git clone <tu-repositorio>
cd backend
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp env.example.txt .env
```

4. Edita el archivo `.env` con tus credenciales:
```
PORT=5000
JWT_SECRET=tu_secreto_super_seguro_cambiar_en_produccion

# Configuración de SQL Server
DB_SERVER=tu_servidor_sql
DB_NAME=EcoMarketplace
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_ENCRYPT=false
DB_TRUST_CERT=true
```

## 🏃 Ejecución

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

El servidor estará disponible en `http://localhost:5000`

## 📡 Endpoints de la API

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión

### Usuarios
- `GET /api/users/profile` - Obtener perfil del usuario autenticado
- `PUT /api/users/profile` - Actualizar perfil

### Desechos
- `GET /api/wastes` - Listar desechos (con paginación)
- `GET /api/wastes/:id` - Obtener desecho por ID
- `POST /api/wastes` - Crear desecho (requiere autenticación)
- `PUT /api/wastes/:id` - Actualizar desecho (requiere autenticación)
- `DELETE /api/wastes/:id` - Eliminar desecho (requiere autenticación)
- `GET /api/wastes/my/wastes` - Obtener mis publicaciones (requiere autenticación)

### Favoritos
- `GET /api/favorites` - Obtener favoritos del usuario (requiere autenticación)
- `POST /api/favorites/:wasteId` - Agregar a favoritos (requiere autenticación)
- `DELETE /api/favorites/:wasteId` - Eliminar de favoritos (requiere autenticación)
- `GET /api/favorites/check/:wasteId` - Verificar si está en favoritos (requiere autenticación)

### Dashboard
- `GET /api/dashboard/stats` - Obtener estadísticas (requiere autenticación)

## 🌐 Despliegue en Render

### Configuración en Render

1. **Crear un nuevo Web Service** en Render
2. **Conectar tu repositorio de GitHub**
3. **Configurar las variables de entorno** en Render:
   - `PORT` - Render lo asigna automáticamente, pero puedes usar 5000
   - `JWT_SECRET` - Genera un secreto seguro
   - `DB_SERVER` - Tu servidor SQL Server
   - `DB_NAME` - Nombre de tu base de datos
   - `DB_USER` - Usuario de SQL Server
   - `DB_PASSWORD` - Contraseña de SQL Server
   - `DB_ENCRYPT` - `true` o `false`
   - `DB_TRUST_CERT` - `true` o `false`

4. **Configuración del Build Command**:
   ```
   npm install
   ```

5. **Configuración del Start Command**:
   ```
   npm start
   ```

6. **Asegúrate de que tu SQL Server sea accesible desde internet** (si está en Azure, configura las reglas de firewall)

### Notas importantes para Render

- Render asigna un puerto dinámico, pero el código usa `process.env.PORT` que Render configura automáticamente
- Asegúrate de que tu SQL Server permita conexiones desde las IPs de Render
- El JWT_SECRET debe ser único y seguro en producción

## 🔒 Seguridad

- Las contraseñas se hashean con bcryptjs
- Los tokens JWT expiran después de un tiempo
- Las rutas protegidas requieren autenticación
- Validación y sanitización de inputs

## 📝 Licencia

ISC

## 👤 Autor

EcoMarketplace Team

