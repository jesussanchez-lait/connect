# Guía de Despliegue - CONNECT

Esta guía te ayudará a desplegar la aplicación CONNECT en producción.

## ✅ Build Exitoso

El proyecto se compila correctamente con:

```bash
npm run build
```

## 🚀 Opciones de Despliegue

### Opción 1: Vercel (Recomendado para Next.js)

Vercel es la plataforma recomendada para aplicaciones Next.js.

#### Pasos:

1. **Instala Vercel CLI** (si no lo tienes):

   ```bash
   npm i -g vercel
   ```

2. **Inicia sesión en Vercel**:

   ```bash
   vercel login
   ```

3. **Despliega**:

   ```bash
   vercel
   ```

4. **Configura variables de entorno en Vercel Dashboard**:

   - Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
   - Settings > Environment Variables
   - Agrega:
     - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Tu clave de Google Maps
     - `NEXT_PUBLIC_APP_URL`: La URL de tu aplicación (ej: https://tu-app.vercel.app)

5. **Configura Firebase**:
   - Asegúrate de que el dominio de Vercel esté autorizado en Firebase Console
   - Ve a Firebase Console > Authentication > Settings > Authorized domains
   - Agrega tu dominio de Vercel (ej: `tu-app.vercel.app`)

#### Despliegue Automático con Git:

1. Conecta tu repositorio GitHub/GitLab/Bitbucket a Vercel
2. Vercel detectará automáticamente Next.js
3. Cada push a `main` desplegará automáticamente

### Opción 2: Netlify

1. **Instala Netlify CLI**:

   ```bash
   npm i -g netlify-cli
   ```

2. **Despliega**:

   ```bash
   netlify deploy --prod
   ```

3. **Configura variables de entorno** en Netlify Dashboard

### Opción 3: Servidor Propio

1. **Build de producción**:

   ```bash
   npm run build
   ```

2. **Inicia el servidor**:

   ```bash
   npm start
   ```

3. **Configura un servidor web** (Nginx, Apache) como proxy reverso

## 📋 Checklist Pre-Despliegue

Antes de desplegar, verifica:

- [ ] Build exitoso (`npm run build`)
- [ ] Variables de entorno configuradas
- [ ] Firebase configurado con dominio de producción
- [ ] reCAPTCHA configurado con dominio de producción
- [ ] Google Maps API Key configurada
- [ ] Dominios autorizados en Firebase Console
- [ ] Pruebas locales funcionando

## 🔧 Configuración de Firebase para Producción

1. **Autorizar dominio de producción**:

   - Firebase Console > Authentication > Settings > Authorized domains
   - Agrega tu dominio de producción

2. **Verificar reCAPTCHA**:

   - Asegúrate de que el site key esté configurado para producción
   - Verifica dominios autorizados en reCAPTCHA Admin Console

3. **Reglas de Firestore**:
   - Revisa `firestore.rules` y asegúrate de que sean apropiadas para producción

## 🌐 Variables de Entorno Requeridas

Crea un archivo `.env.production` o configura en tu plataforma:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_de_produccion
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

## 📝 Notas Importantes

- Las credenciales de Firebase están hardcodeadas en `src/infrastructure/firebase/config.ts`
- Para producción, considera mover las credenciales a variables de entorno
- El script de reCAPTCHA se carga automáticamente desde `app/layout.tsx`
- Asegúrate de que el dominio de producción esté autorizado en Firebase

## 🐛 Solución de Problemas

### Error: "auth/invalid-app-credential"

- Verifica que el dominio esté autorizado en Firebase Console
- Revisa la configuración de reCAPTCHA

### Error: "Google Maps no carga"

- Verifica que la API Key esté configurada correctamente
- Asegúrate de que la API de Maps esté habilitada en Google Cloud Console

### Error: "Build falla"

- Ejecuta `npm run build` localmente para ver errores
- Verifica que todas las dependencias estén instaladas

## 📞 Soporte

Para más información, consulta:

- [Documentación de Next.js](https://nextjs.org/docs/deployment)
- [Documentación de Vercel](https://vercel.com/docs)
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) para configuración de Firebase
