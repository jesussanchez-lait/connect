# Configuración de Variables de Entorno

Para que la aplicación funcione correctamente, necesitas crear un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

## Variables Requeridas

### `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

**Requerido para:** Funcionalidad del mapa de Google Maps

**Cómo obtenerlo:**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de "Maps JavaScript API"
4. Ve a "Credenciales" y crea una nueva clave de API
5. Copia la clave y pégala en tu archivo `.env.local`

**Ejemplo:**

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### `NEXT_PUBLIC_APP_URL` (Opcional)

**Requerido para:** Generar URLs correctas en el código QR

**Valor por defecto:** `http://localhost:3000`

**Ejemplo:**

```env
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

## Archivo `.env.local` de Ejemplo

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_aqui

# URL de la aplicación (opcional)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Configuración de Firebase Phone Authentication

Para que la autenticación por teléfono funcione correctamente, asegúrate de que:

### 1. Configurar Dominios Autorizados

**IMPORTANTE:** El error `auth/invalid-app-credential` generalmente ocurre cuando el dominio no está autorizado.

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto `connect-tierra`
3. Ve a **Authentication** > **Settings** > **Authorized domains**
4. Asegúrate de que los siguientes dominios estén autorizados:
   - `localhost` (para desarrollo local)
   - Tu dominio de producción (ej: `tu-dominio.com`)
   - `connect-tierra.firebaseapp.com` (dominio de Firebase)

### 2. Configurar reCAPTCHA

1. Ve a Firebase Console > **Authentication** > **Sign-in method** > **Phone**
2. Habilita **Phone** como método de autenticación
3. Verifica que reCAPTCHA esté habilitado
4. El sitio de reCAPTCHA "lait-connect" debe estar configurado en la consola de reCAPTCHA de Google

### 3. Verificar Credenciales de la Aplicación

1. Ve a Firebase Console > **Project Settings** > **General**
2. Verifica que las credenciales de la aplicación web sean correctas:
   - API Key
   - Auth Domain
   - Project ID
   - App ID

### 4. Contenedor de reCAPTCHA

- El código incluye un contenedor invisible (`recaptcha-container`) en los formularios de login y registro
- Este contenedor es necesario para que Firebase pueda inicializar reCAPTCHA
- Asegúrate de que el elemento con `id="recaptcha-container"` esté presente en el DOM antes de enviar el OTP

### Solución de Problemas

Si recibes el error `auth/invalid-app-credential`:

1. **Verifica dominios autorizados:** Asegúrate de que `localhost` esté en la lista de dominios autorizados
2. **Verifica reCAPTCHA:** Confirma que reCAPTCHA esté habilitado en Firebase Console
3. **Limpia caché del navegador:** A veces el navegador cachea credenciales antiguas
4. **Verifica la consola del navegador:** Revisa los logs de depuración para más detalles
5. **Revisa las reglas de Firestore:** Asegúrate de que las reglas permitan la autenticación

## Notas Importantes

- El archivo `.env.local` está en `.gitignore` y no se subirá al repositorio
- Después de crear o modificar `.env.local`, reinicia el servidor de desarrollo
- Las variables que empiezan con `NEXT_PUBLIC_` son accesibles en el cliente (navegador)
- No compartas tu API key públicamente
- El token de reCAPTCHA "lait-connect" debe estar configurado en Firebase Console
