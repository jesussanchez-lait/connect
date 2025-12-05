# Guía de Configuración de Firebase Phone Authentication

Esta guía te ayudará a resolver el error `auth/invalid-app-credential` paso a paso.

## 🔴 Error: auth/invalid-app-credential

Este error indica que Firebase no puede validar las credenciales de tu aplicación. Sigue estos pasos en orden:

## Paso 1: Verificar Dominios Autorizados ⚠️ CRÍTICO

**Este es el paso más importante y la causa más común del error.**

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **connect-tierra**
3. Ve a **Authentication** (en el menú lateral izquierdo)
4. Haz clic en la pestaña **Settings** (Configuración)
5. Desplázate hasta la sección **Authorized domains** (Dominios autorizados)
6. **VERIFICA** que los siguientes dominios estén en la lista:
   - ✅ `localhost` (DEBE estar para desarrollo local)
   - ✅ `connect-tierra.firebaseapp.com` (dominio de Firebase)
   - ✅ Tu dominio de producción (si aplica)

### Si `localhost` NO está en la lista:

1. Haz clic en **Add domain** (Agregar dominio)
2. Escribe: `localhost`
3. Haz clic en **Add**
4. Espera unos segundos para que se actualice

## Paso 2: Verificar Configuración de Phone Authentication

1. En Firebase Console, ve a **Authentication** > **Sign-in method**
2. Busca **Phone** en la lista de proveedores
3. **VERIFICA** que:
   - ✅ Phone Authentication esté **Enabled** (Habilitado)
   - ✅ El estado muestre "Phone sign-in is enabled"

### Si Phone Authentication NO está habilitado:

1. Haz clic en **Phone**
2. Activa el toggle **Enable**
3. Haz clic en **Save**

## Paso 3: Verificar Credenciales de la Aplicación Web

1. En Firebase Console, ve a **Project Settings** (⚙️ en el menú lateral)
2. Desplázate hasta la sección **Your apps**
3. Busca tu aplicación web (debería tener el nombre de tu app)
4. **VERIFICA** que las credenciales coincidan con las de `src/infrastructure/firebase/config.ts`:
   - ✅ **API Key**: Debe coincidir con `apiKey` en config.ts
   - ✅ **Auth Domain**: Debe ser `connect-tierra.firebaseapp.com`
   - ✅ **Project ID**: Debe ser `connect-tierra`
   - ✅ **App ID**: Debe coincidir con `appId` en config.ts

## Paso 4: Verificar Configuración de reCAPTCHA v3

Este proyecto está configurado para usar **reCAPTCHA v3**. Verifica:

1. **Site Key de reCAPTCHA v3:**

   - Site Key: `6LdtfCIsAAAAAGKD9vHbGG-HBRmYTbEp17_S9xhC`
   - Este site key está configurado en `app/layout.tsx` y se carga automáticamente

2. **En Firebase Console:**

   - Ve a **Authentication** > **Sign-in method** > **Phone**
   - Verifica que reCAPTCHA esté habilitado
   - Asegúrate de que el site key esté vinculado al proyecto

3. **En Google reCAPTCHA Admin Console:**

   - Ve a [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
   - Verifica que el site key `6LdtfCIsAAAAAGKD9vHbGG-HBRmYTbEp17_S9xhC` esté configurado
   - Asegúrate de que los dominios autorizados incluyan `localhost` y tu dominio de producción

4. **Verificar que el script se carga:**
   - El script de reCAPTCHA v3 se carga automáticamente en `app/layout.tsx`
   - Verifica en las DevTools (F12) > Network que el script se carga correctamente
   - Busca: `recaptcha/api.js?render=6LdtfCIsAAAAAGKD9vHbGG-HBRmYTbEp17_S9xhC`

## Paso 5: Verificar el Contenedor de reCAPTCHA en el Código

Asegúrate de que el contenedor de reCAPTCHA esté presente en tus formularios:

### En LoginForm.tsx:

```tsx
<div id="recaptcha-container" className="hidden"></div>
```

### En RegisterForm.tsx:

```tsx
<div id="recaptcha-container" className="hidden"></div>
```

**IMPORTANTE:** Este elemento DEBE estar en el DOM antes de intentar enviar el OTP.

## Paso 6: Limpiar Caché y Probar

Después de hacer los cambios en Firebase Console:

1. **Limpia la caché del navegador:**

   - Chrome/Edge: `Ctrl+Shift+Delete` (Windows) o `Cmd+Shift+Delete` (Mac)
   - Selecciona "Cached images and files"
   - Haz clic en "Clear data"

2. **Reinicia el servidor de desarrollo:**

   ```bash
   # Detén el servidor (Ctrl+C)
   # Luego reinícialo
   npm run dev
   ```

3. **Abre la aplicación en modo incógnito/privado** para evitar problemas de caché

## Paso 7: Verificar Logs en la Consola

Abre las DevTools del navegador (F12) y revisa la consola. Deberías ver logs como:

```
🔐 [DEBUG] Iniciando inicialización de reCAPTCHA...
✅ [DEBUG] Contenedor de reCAPTCHA encontrado
⏳ [DEBUG] Esperando a que reCAPTCHA esté disponible...
✅ [DEBUG] reCAPTCHA ya está disponible
🔐 [DEBUG] Creando nuevo RecaptchaVerifier...
✅ [DEBUG] RecaptchaVerifier creado exitosamente
✅ [DEBUG] reCAPTCHA listo para usar
```

Si ves errores, cópialos y compártelos para diagnóstico.

## Solución de Problemas Comunes

### Problema: "Contenedor de reCAPTCHA no encontrado"

**Solución:** Asegúrate de que el elemento `<div id="recaptcha-container"></div>` esté presente en el componente antes de enviar el OTP.

### Problema: "Firebase Auth no está inicializado"

**Solución:** Verifica que `src/infrastructure/firebase/config.ts` tenga las credenciales correctas.

### Problema: El error persiste después de verificar todo

**Solución:**

1. Verifica que estés usando la misma cuenta de Firebase en la consola y en el código
2. Intenta crear una nueva aplicación web en Firebase Console y actualiza las credenciales
3. Verifica que no haya restricciones de red/firewall bloqueando las solicitudes a Firebase

## Verificación Rápida ✅

Antes de probar, verifica que tengas:

- [ ] `localhost` en dominios autorizados
- [ ] Phone Authentication habilitado
- [ ] Credenciales correctas en config.ts
- [ ] Contenedor de reCAPTCHA en los formularios
- [ ] Caché del navegador limpiada
- [ ] Servidor de desarrollo reiniciado

## Contacto y Soporte

Si después de seguir todos estos pasos el error persiste:

1. Revisa los logs en la consola del navegador
2. Verifica los logs del servidor
3. Comparte los mensajes de error específicos para diagnóstico
