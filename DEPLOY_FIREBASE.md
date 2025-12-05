# Guía de Despliegue en Firebase Hosting - CONNECT

Esta guía te ayudará a desplegar la aplicación Next.js como SPA estática en Firebase Hosting.

## ✅ Build Exitoso

El proyecto se compila correctamente con:

```bash
npm run build:firebase
```

Este comando:

1. Mueve temporalmente las rutas API (no compatibles con export estático)
2. Genera el build estático en el directorio `out/`
3. Restaura las rutas API después del build

## 🚀 Desplegar a Firebase Hosting

### Paso 1: Verificar Configuración

El archivo `firebase.json` ya está configurado:

- **Site**: `connect-tierra-demo`
- **Public**: `out` (directorio de export estático de Next.js)
- **Rewrites**: Todas las rutas se redirigen a `index.html` (SPA)

### Paso 2: Build y Verificación

El script `build:firebase` automáticamente:

1. Mueve temporalmente las rutas API
2. Genera el build estático en `out/`
3. Restaura las rutas API
4. Verifica que solo se desplieguen archivos estáticos necesarios

```bash
npm run build:firebase
```

### Paso 3: Desplegar

```bash
firebase deploy --only hosting:connect-tierra-demo
```

O usando el script completo (build + deploy):

```bash
npm run deploy:firebase
```

### Verificación de Archivos

Antes de desplegar, puedes verificar qué archivos se desplegarán:

```bash
node scripts/verify-deploy-files.js
```

Este script verifica que:

- ✅ `index.html` y `404.html` estén presentes
- ✅ Solo se incluyan archivos estáticos (HTML, JS, CSS, assets)
- ✅ Se excluyan archivos innecesarios (server, types, cache, etc.)

## 📋 Configuración Actual

### next.config.js

- `output: "export"` - Genera export estático
- `distDir: "out"` - Directorio de salida
- `images.unoptimized: true` - Necesario para export estático
- `trailingSlash: true` - Agrega barra final a las rutas

### firebase.json

- **Public**: `out` - Directorio de archivos estáticos
- **Rewrites**: Todas las rutas (`**`) redirigen a `index.html` para SPA
- **Headers**: Cacheo optimizado para assets estáticos

## ⚠️ Limitaciones del Export Estático

Con `output: "export"`, las siguientes características NO funcionan:

1. **Rutas API** (`app/api/*`):

   - Se excluyen automáticamente del build
   - Si necesitas APIs, usa Firebase Functions o un backend separado

2. **Server Components**:

   - Todas las páginas deben ser client-side o tener wrappers server-side simples

3. **Rutas Dinámicas**:
   - Requieren `generateStaticParams()`
   - Se generan estáticamente en build time
   - Las rutas no pre-generadas se manejan dinámicamente en el cliente

## 🔧 Solución de Problemas

### Error: "Page is missing generateStaticParams()"

- Asegúrate de que todas las rutas dinámicas tengan `generateStaticParams()`
- Retorna al menos un parámetro para que Next.js pueda generar la página

### Error: "Cannot use API routes with static export"

- Las rutas API se excluyen automáticamente durante el build
- Si necesitas APIs, considera usar Firebase Functions

### El sitio no carga correctamente

- Verifica que `firebase.json` apunte a `out`
- Verifica que los rewrites estén configurados para redirigir a `index.html`
- Revisa la consola del navegador para errores

## 📝 Notas Importantes

1. **Variables de Entorno**:

   - Las variables `NEXT_PUBLIC_*` se incluyen en el build
   - Configúralas antes de ejecutar `npm run build:firebase`

2. **Firebase Auth**:

   - Asegúrate de que el dominio de Firebase Hosting esté autorizado
   - Ve a Firebase Console > Authentication > Settings > Authorized domains

3. **reCAPTCHA**:

   - El script se carga automáticamente desde `app/layout.tsx`
   - Verifica que el site key esté configurado correctamente

4. **Rutas Dinámicas**:
   - La ruta `/dashboard/campaigns/[id]` se genera estáticamente con `id: "dummy"`
   - Todas las demás rutas se manejan dinámicamente en el cliente

## 🎯 Comandos Útiles

```bash
# Build para Firebase
npm run build:firebase

# Desplegar a Firebase Hosting
firebase deploy --only hosting:connect-tierra-demo

# Ver logs de Firebase
firebase hosting:channel:list

# Abrir sitio desplegado
firebase open hosting:site
```

## ✅ Checklist Pre-Despliegue

- [ ] Build exitoso (`npm run build:firebase`)
- [ ] Directorio `out/` creado con archivos estáticos
- [ ] `firebase.json` configurado correctamente
- [ ] Dominio autorizado en Firebase Console
- [ ] Variables de entorno configuradas (si aplica)
- [ ] reCAPTCHA configurado correctamente
