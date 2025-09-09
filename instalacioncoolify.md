# 🚀 Guía de Instalación Paso a Paso - Proyecto Event Photo Gallery en Coolify

## 📋 Prerrequisitos
- Repositorio en GitHub con tu código
- Instancia de Coolify funcionando
- Acceso admin a Coolify

---

## 🔧 Paso 1: Crear Nueva Aplicación

### 1.1 Acceder a Coolify
- Ir a tu panel de Coolify
- Clic en **"Add Resource"** → **"Public Repository"**

### 1.2 Configuración del Repositorio
- **Git Provider**: Seleccionar GitHub
- **Repository URL**: `https://github.com/RogelioM01/photoshareevent02`
- **Branch**: `main`
- **Source Type**: Public Repository

---

## ⚙️ Paso 2: Configuración General

### 2.1 Build Configuration
```
Build Pack: Nixpacks (Auto-detectado)
Base Directory: /
```

⚠️ **ARCHIVO CRÍTICO:** Asegúrate de que exista `nixpacks.toml` en la raíz del proyecto
- Sin este archivo, Nixpacks detectará la app como SPA estática (❌)
- Con este archivo, ejecutará el servidor Express correctamente (✅)

**¿Por qué `/` en Base Directory?**
- Tu aplicación está en la raíz del repositorio
- No es un monorepo con subcarpetas
- Los archivos `package.json`, `server/`, `client/` están en la raíz

### 2.2 Network Configuration
```
Port: 5000
Health Check: /api (opcional)
```

**¿Por qué Puerto 5000?**
- Tu aplicación Express está configurada para servir en puerto 5000
- Sirve tanto el frontend como el backend desde el mismo puerto

### 2.3 Deployment Configuration
```
Auto Deploy: ✅ Habilitado
Watch Paths: (dejar vacío para todo el repo)
```

---

## 🔐 Paso 3: Variables de Entorno (CRÍTICO)

### 3.1 Variables de Base de Datos
```
Variable: DATABASE_URL
Valor: postgresql://user:password@host:port/database
Build Variable: ❌ NO marcar
System Variable: ❌ NO marcar
```

### 3.2 Variables de Cloudinary (Obligatorias)
```
Variable: CLOUDINARY_CLOUD_NAME
Valor: tu_cloud_name (ej: drmyiqo9n)
Build Variable: ❌ NO marcar
System Variable: ❌ NO marcar

Variable: CLOUDINARY_API_KEY  
Valor: tu_api_key
Build Variable: ❌ NO marcar
System Variable: ❌ NO marcar

Variable: CLOUDINARY_API_SECRET
Valor: tu_api_secret  
Build Variable: ❌ NO marcar
System Variable: ❌ NO marcar

Variable: VITE_CLOUDINARY_CLOUD_NAME
Valor: tu_cloud_name (mismo que arriba)
Build Variable: ✅ SÍ marcar (necesario para build de Vite)
System Variable: ❌ NO marcar
```

### 3.3 Variables de Email (Emailit)
```
Variable: EMAILIT_API_KEY
Valor: tu_clave_emailit
Build Variable: ❌ NO marcar
System Variable: ❌ NO marcar

Variable: EMAILIT_FROM_EMAIL
Valor: noreply@rocky.mx
Build Variable: ❌ NO marcar
System Variable: ❌ NO marcar

Variable: EMAILIT_FROM_NAME
Valor: Rocky Events
Build Variable: ❌ NO marcar
System Variable: ❌ NO marcar

Variable: USE_EMAILIT
Valor: true
Build Variable: ❌ NO marcar
System Variable: ❌ NO marcar
```

### 3.4 Variables del Sistema
```
Variable: NODE_ENV
Valor: production
Build Variable: ✅ SÍ marcar (necesario para build optimizado)
System Variable: ❌ NO marcar

Variable: SESSION_SECRET
Valor: tu_clave_secreta_muy_larga_y_segura
Build Variable: ❌ NO marcar
System Variable: ❌ NO marcar

Variable: NIXPACKS_NODE_VERSION
Valor: 18
Build Variable: ✅ SÍ marcar (controla versión Node.js)
System Variable: ❌ NO marcar
```

### 3.5 Variables Opcionales
```
Variable: EMAIL_FORCE_ADMIN
Valor: false
Build Variable: ❌ NO marcar
System Variable: ❌ NO marcar
```

---

## 📊 Guía: ¿Cuándo marcar "Build Variable"?

### ✅ SÍ marcar Build Variable para:
- `NODE_ENV` - Necesario para optimización de build
- `VITE_CLOUDINARY_CLOUD_NAME` - Variables VITE_* necesarias en build
- `NIXPACKS_NODE_VERSION` - Controla versión de Node.js durante build
- Cualquier variable que comience con `VITE_` o `NEXT_PUBLIC_`

### ❌ NO marcar Build Variable para:
- `DATABASE_URL` - Solo necesaria en runtime
- `CLOUDINARY_API_SECRET` - Secretos de runtime
- `EMAILIT_API_KEY` - Credenciales de runtime
- `SESSION_SECRET` - Secretos de sesión

### 🚫 NUNCA marcar "System Variable"
- Esta opción es para variables del sistema operativo
- Tu aplicación no necesita variables del sistema

---

## 🚀 Paso 4: Deployment

### 4.1 Build Process
Coolify ejecutará automáticamente:
```bash
npm ci                    # Instalar dependencias
npm run build            # Build del frontend (Vite)
npm start                # Iniciar aplicación
```

### 4.2 Verificar Build
- **Build Logs**: Verificar que no haya errores
- **Container Status**: Debe mostrar "Running"
- **Health Check**: Puerto 5000 debe responder

### 4.3 Configurar Dominio
- **Domains** → **Add Domain**
- **Custom Domain**: `tu-app.rocky.mx`
- **SSL**: Auto-generado por Let's Encrypt

---

## 🔍 Paso 5: Verificación Post-Deploy

### 5.1 Endpoints a Probar
```
https://tu-app.rocky.mx/           # Frontend
https://tu-app.rocky.mx/api        # API Status
https://tu-app.rocky.mx/admin      # Panel Admin
```

### 5.2 Funcionalidades Críticas
- ✅ Login funciona
- ✅ Subida de fotos (Cloudinary)
- ✅ Base de datos conectada
- ✅ Emails enviándose

---

## 🛠 Troubleshooting Común

### Build Falla en `npm ci`
**Solución**: 
- Verificar que `package.json` y `package-lock.json` estén sincronizados
- Aumentar memoria del servidor (mínimo 4GB)

### Error "No Available Server"
**Solución**:
- Verificar que puerto 5000 coincida en configuración
- Tu app debe hacer bind a `0.0.0.0:5000`, no `localhost:5000`

### Variables de Entorno no Disponibles
**Solución**:
- Variables VITE_* deben marcarse como "Build Variable"
- Hacer "Force Deploy" para refrescar build

### Cloudinary no Funciona
**Solución**:
- Verificar que `VITE_CLOUDINARY_CLOUD_NAME` esté marcada como Build Variable
- Confirmar credenciales de Cloudinary

---

## 📝 Resumen de Configuración Final

```
✅ Build Pack: Nixpacks
✅ Base Directory: /
✅ Port: 5000
✅ Variables de entorno configuradas (ver lista arriba)
✅ Build Variables marcadas correctamente
✅ Auto Deploy habilitado
✅ Dominio configurado con SSL
```

Con esta configuración, tu aplicación Event Photo Gallery debería funcionar completamente en Coolify con todas las funcionalidades: usuarios, eventos, fotos, comentarios, RSVP y emails.

---

## 🆘 Soporte

Si tienes problemas:
1. **Revisar logs** en Coolify → Application → Logs
2. **Verificar variables** en Environment Variables
3. **Probar build local** con `npm run build && npm start`
4. **Contactar soporte** con logs específicos