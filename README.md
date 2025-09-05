# Event Photo Gallery & RSVP Platform

Una plataforma completa para gestión de eventos con galería de fotos, sistema de registro de invitados, QR codes para check-in y análisis con Gemini AI.

## Características Principales

- 🎉 **Eventos Personalizados**: Cada usuario tiene su página de evento con personalización completa
- 📸 **Galería Multimedia**: Subida de fotos y videos con thumbnails automáticos (Cloudinary)
- 📱 **Sistema RSVP Completo**: Registro de invitados con QR codes únicos
- 📲 **Check-in con QR Scanner**: Scanner de cámara real para check-in de asistentes
- 🤖 **Integración Gemini AI**: Análisis inteligente de fotos y generación de contenido
- 👥 **Gestión Avanzada**: Panel de administración con estadísticas en tiempo real
- 🔐 **Autenticación Robusta**: Sistema multi-usuario con roles diferenciados
- 🌐 **Interfaz Española**: Completamente localizada para usuarios hispanohablantes
- 📱 **Mobile-First**: Diseño optimizado para dispositivos móviles
- ⚡ **Tiempo Real**: Estadísticas y actualizaciones automáticas con React Query

## Stack Tecnológico

### Frontend
- **React 18** con TypeScript y hooks modernos
- **Vite** para desarrollo rápido y builds optimizados
- **Tailwind CSS** + **shadcn/ui** para diseño consistente
- **Wouter** para enrutamiento ligero
- **TanStack React Query** para gestión de estado del servidor
- **jsQR** para detección de códigos QR en tiempo real
- **React Hook Form** + **Zod** para validación de formularios

### Backend
- **Node.js** con **Express.js** y TypeScript
- **PostgreSQL** con **Drizzle ORM** para consultas type-safe
- **Supabase** para autenticación y almacenamiento de archivos
- **Cloudinary** para optimización de imágenes y videos
- **Multer** para procesamiento de uploads multipart

### Servicios Externos
- **Google Gemini AI** para análisis inteligente de fotos
- **QR Server API** para generación dinámica de códigos QR
- **Supabase Storage** para CDN y gestión de archivos multimedia
- **Cloudinary** para transformación automática de medios

### Base de Datos
- **PostgreSQL** (Supabase) con esquema optimizado
- **Tablas principales**: app_users, events, photos, text_posts, event_attendees
- **Relaciones CASCADE** para integridad referencial
- **Índices optimizados** para consultas de eventos y asistencia

## Instalación y Configuración

### 1. Preparación del Proyecto
```bash
git clone <tu-repositorio>
cd event-photo-gallery
npm install
```

### 2. Variables de Entorno
Crea un archivo `.env` con las siguientes variables:

```bash
# Base de Datos (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]/postgres
SUPABASE_DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]/postgres

# Supabase Storage
SUPABASE_URL=https://[PROJECT_ID].supabase.co
SUPABASE_ANON_KEY=tu_clave_publica_supabase
SUPABASE_SERVICE_KEY=tu_clave_servicio_supabase

# Cloudinary (Imágenes/Videos)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Google Gemini AI
GEMINI_API_KEY=tu_gemini_api_key

# Frontend (Vite)
VITE_CLOUDINARY_CLOUD_NAME=tu_cloud_name
VITE_SUPABASE_URL=https://[PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_publica_supabase
```

### 3. Base de Datos
```bash
# Aplicar esquema a la base de datos
npm run db:push

# (Opcional) Abrir Drizzle Studio para gestión visual
npm run db:studio
```

### 4. Desarrollo
```bash
# Iniciar servidor de desarrollo (Frontend + Backend)
npm run dev

# La aplicación estará disponible en http://localhost:5000
```

## Flujo de Uso Típico

### Para Organizadores de Eventos
1. **Login** → Acceso con credenciales de usuario
2. **Dashboard** → Configurar evento personal (título, descripción, imagen)
3. **Configuración** → Personalizar fecha, hora, fondo y opciones avanzadas
4. **Compartir** → Enviar enlace `/evento/username` a invitados
5. **Gestión** → Usar `/evento/username/checkin` para check-in durante el evento

### Para Invitados
1. **Registro** → Confirmar asistencia en `/evento/username-asistencia`
2. **QR Personal** → Recibir código QR único para check-in
3. **Evento** → Usar QR para check-in y subir fotos en `/evento/username-album`
4. **Participación** → Crear publicaciones y ver contenido compartido

## Estructura del Proyecto

```
├── client/          # Frontend React
│   ├── src/
│   │   ├── components/  # Componentes reutilizables
│   │   ├── pages/       # Páginas de la aplicación
│   │   ├── hooks/       # Hooks personalizados
│   │   └── lib/         # Utilidades
├── server/          # Backend Express
│   ├── routes.ts    # Rutas de la API
│   └── storage.ts   # Lógica de base de datos
├── shared/          # Código compartido
│   └── schema.ts    # Esquemas de base de datos
└── uploads/         # Archivos subidos (desarrollo)
```

## Usuarios Predeterminados

- **Admin**: `admin` / `password`
- **Usuario**: `sofia` / `sofia01`
- **Usuario**: `javier` / `javier01`

## Mapa Completo de Rutas

### 🔐 Autenticación
- `/` - **Página de Login**: Entrada principal con autenticación por usuario/contraseña

### 👤 Gestión de Usuario
- `/dashboard` - **Panel Personal**: Control de evento personal y acciones rápidas
- `/admin` - **Panel Administrativo**: Gestión completa de usuarios (solo administradores)

### 🎉 Eventos Personales
- `/evento/:username` - **Página de Evento Personal**: Vista pública del evento del usuario
- `/evento/:username-album` - **Galería del Evento**: Fotos, videos y publicaciones del evento
- `/evento/:username/configuracion` - **Configuración Avanzada**: Ajustes completos del evento

### 📝 Sistema RSVP y Check-in
- `/evento/:username-asistencia` - **Registro de Invitados**: Formulario temático para confirmación
- `/evento/:username/checkin` - **Panel Check-in**: Scanner QR y gestión manual de asistencia

### 🔧 Rutas de API Principales

#### Eventos
- `GET /api/evento/:username` - Datos del evento personal
- `GET /api/events/:eventId` - Información detallada del evento
- `POST /api/events/:eventId/photos` - Subir fotos/videos
- `POST /api/events/:eventId/posts` - Crear publicación de texto

#### Sistema RSVP
- `GET /api/events/:eventId/attendee-stats` - Estadísticas de asistencia
- `GET /api/events/:eventId/attendees` - Lista de asistentes
- `POST /api/events/:eventId/confirm-attendance` - Confirmar asistencia
- `POST /api/events/:eventId/checkin` - Check-in con QR code
- `GET /api/events/:eventId/my-attendance/:userId` - Estado personal de asistencia

#### Administración
- `GET /api/users` - Lista de usuarios (admin)
- `POST /api/users` - Crear usuario (admin)
- `PUT /api/users/:id` - Actualizar usuario (admin)
- `DELETE /api/users/:id` - Eliminar usuario (admin)

#### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/user` - Datos del usuario actual

## Funcionalidades Avanzadas

### 📲 Sistema QR y Check-in
- **QR Únicos**: Códigos format-optimized como `NOMBRE1234` (10 caracteres)
- **Scanner Real**: Detección de QR con cámara usando jsQR + Canvas
- **Check-in Manual**: Toggle admin para cambiar estados sin QR
- **Estados**: Pendiente → Confirmado → Presente (unidireccional)
- **Tiempo Real**: Estadísticas actualizadas instantáneamente

### 🤖 Integración Gemini AI
- **Análisis de Fotos**: Descripción automática de contenido
- **Generación de Contenido**: Texto contextual para eventos
- **Procesamiento Multimodal**: Soporte para imágenes y videos

### 🎨 Personalización de Eventos
- **Fondos Dinámicos**: Gradientes personalizables
- **Fecha y Hora Inteligente**: Selector híbrido con presets
- **Temas Adaptativos**: Páginas que heredan diseño del evento
- **QR Personalizados**: Códigos temáticos por evento

## Desarrollo

### Comandos Disponibles

```bash
npm run dev          # Desarrollo (Frontend + Backend)
npm run build        # Build de producción
npm run db:push      # Migrar base de datos
npm run db:studio    # Abrir Drizzle Studio para gestión visual
npm run preview      # Preview del build de producción
```

### Scripts de Base de Datos
```bash
npm run db:generate  # Generar migraciones de Drizzle
npm run db:migrate   # Aplicar migraciones pendientes
npm run db:pull      # Sincronizar esquema desde DB existente
```

### Contribuir

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## Soporte

Para soporte, abre un issue en el repositorio o contacta al equipo de desarrollo.