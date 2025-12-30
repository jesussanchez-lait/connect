# Persistencia de Sesión - CONNECT

## Resumen

Firebase Auth mantiene la sesión del usuario activa automáticamente usando `localStorage`. **El usuario NO necesita iniciar sesión cada vez que abre la app**. Solo se pedirá OTP si el usuario cierra sesión explícitamente.

## Cómo Funciona

### Persistencia Automática

Firebase Auth está configurado para usar `browserLocalPersistence`, lo que significa:

- ✅ La sesión persiste incluso si el usuario cierra la app
- ✅ La sesión persiste incluso si el usuario reinicia el teléfono
- ✅ La sesión persiste incluso si el usuario cierra el navegador
- ✅ El token se renueva automáticamente cuando expira

### Flujo de Autenticación

1. **Primera vez**: Usuario ingresa número de teléfono → Recibe OTP → Verifica OTP → Sesión creada
2. **Siguientes veces**: Usuario abre la app → Firebase Auth detecta sesión activa → Usuario accede directamente al dashboard
3. **Cerrar sesión**: Usuario presiona "Cerrar Sesión" → Sesión eliminada → Usuario debe iniciar sesión de nuevo

### Implementación Técnica

#### Configuración de Persistencia

```typescript
// src/infrastructure/firebase/config.ts
setPersistence(auth, browserLocalPersistence);
```

Esto asegura que Firebase Auth use `localStorage` para guardar la sesión.

#### Verificación de Sesión Activa

El hook `useAuth` escucha cambios en el estado de autenticación usando `onAuthStateChanged`:

```typescript
// src/presentation/hooks/useAuth.ts
onAuthStateChanged(auth, (firebaseUser) => {
  // Si firebaseUser existe, el usuario está autenticado
  // Firebase Auth maneja la persistencia automáticamente
});
```

#### Prevención de OTP Innecesario

El componente `LoginForm` verifica si el usuario ya está autenticado antes de mostrar el formulario:

```typescript
// src/presentation/components/auth/LoginForm.tsx
useEffect(() => {
  if (!authLoading && isAuthenticated) {
    router.push("/dashboard");
  }
}, [isAuthenticated, authLoading, router]);
```

## Buenas Prácticas

### ✅ Hacer

- **Confiar en Firebase Auth**: Firebase maneja la persistencia automáticamente
- **No cerrar sesión automáticamente**: Solo cerrar sesión cuando el usuario lo solicite explícitamente
- **Manejar errores temporales**: Si hay un error de red al obtener datos del usuario, mantener la sesión activa
- **Verificar sesión antes de pedir OTP**: El `LoginForm` ya verifica si hay sesión activa

### ❌ No Hacer

- **NO cerrar sesión en errores temporales**: Errores de red o permisos no deberían cerrar la sesión
- **NO pedir OTP si hay sesión activa**: Verificar siempre antes de mostrar el formulario de login
- **NO usar `sessionStorage`**: Usar `localStorage` para persistencia entre sesiones del navegador
- **NO limpiar tokens manualmente**: Firebase maneja la renovación automáticamente

## Reautenticación por Seguridad

Si necesitas reautenticación por seguridad (ej. para operaciones sensibles como transferencias bancarias), considera:

### Opción 1: Biometría Local (Recomendado)

Usar biometría del dispositivo (huella/FaceID) para "desbloquear" la app localmente, en lugar de pedir OTP a Firebase cada vez.

**Ventajas:**

- ✅ No consume límites de OTP de Firebase
- ✅ Más rápido para el usuario
- ✅ Funciona offline
- ✅ Mejor experiencia de usuario

**Implementación sugerida:**

- Usar `WebAuthn` API para autenticación biométrica
- Guardar un flag local que indica que la app está "desbloqueada"
- El flag expira después de X minutos de inactividad

### Opción 2: Reautenticación con Firebase (Solo si es necesario)

Si realmente necesitas reautenticación con Firebase, usar `reauthenticateWithPhoneNumber`:

```typescript
import { reauthenticateWithPhoneNumber } from "firebase/auth";

// Solo usar si es absolutamente necesario
await reauthenticateWithPhoneNumber(auth.currentUser, phoneAuthCredential);
```

**⚠️ Advertencia**: Esto consume límites de OTP de Firebase. Usar solo para operaciones críticas.

## Troubleshooting

### Usuario tiene que iniciar sesión cada vez

**Causa posible**: La persistencia no está configurada correctamente.

**Solución**: Verificar que `setPersistence(auth, browserLocalPersistence)` se ejecute al inicializar Firebase.

### Sesión se pierde después de cerrar el navegador

**Causa posible**: Se está usando `sessionStorage` en lugar de `localStorage`.

**Solución**: Asegurar que se use `browserLocalPersistence` (no `browserSessionPersistence`).

### Error "Token expired" pero usuario sigue autenticado

**Causa**: Esto es normal. Firebase renueva tokens automáticamente.

**Solución**: No hacer nada. Firebase maneja esto automáticamente.

## Referencias

- [Firebase Auth Persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence)
- [Firebase Auth State Changes](https://firebase.google.com/docs/auth/web/manage-users#get_the_currently_signed-in_user)
- [WebAuthn API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
