# Configuración PWA - Connect

Este proyecto ahora está configurado como Progressive Web App (PWA), permitiendo instalación en dispositivos móviles y funcionamiento offline.

## Archivos Creados

### 1. `public/manifest.json`

Manifest de la aplicación PWA que define:

- Nombre y descripción de la app
- Iconos y colores del tema
- Modo de visualización (standalone)
- Shortcuts para acceso rápido

### 2. `public/sw.js`

Service Worker que maneja:

- Cacheo de assets estáticos
- Funcionalidad offline
- Estrategias de cache (Cache First para assets, Network First para páginas)
- Actualización automática del cache

### 3. `src/presentation/hooks/useServiceWorker.ts`

Hook React para:

- Registrar el service worker
- Detectar estado online/offline
- Manejar actualizaciones del service worker
- Proporcionar funciones de control

### 4. `src/presentation/components/ServiceWorkerRegistration.tsx`

Componente cliente que registra automáticamente el service worker al cargar la aplicación.

### 5. `public/browserconfig.xml`

Configuración para Windows tiles (opcional).

## Iconos Requeridos

Para completar la configuración PWA, necesitas crear los siguientes iconos en la carpeta `public/`:

- `icon-192.png` - 192x192px (para Android y favicon)
- `icon-512.png` - 512x512px (para Android y splash screen)

### Recomendaciones para los Iconos

1. **Diseño**: Usar el logo de Connect con fondo sólido o transparente
2. **Formato**: PNG con transparencia si es necesario
3. **Tamaños**: Exactamente 192x192 y 512x512 píxeles
4. **Contenido**: El icono debe ser reconocible incluso en tamaño pequeño

Puedes usar herramientas como:

- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Favicon.io](https://favicon.io/)

## Funcionalidades PWA Implementadas

### ✅ Instalación

- La app puede instalarse en dispositivos móviles y desktop
- Aparecerá en la pantalla de inicio como una app nativa

### ✅ Offline

- Assets estáticos se cachean automáticamente
- Las páginas visitadas funcionan offline
- Estrategia Network First para contenido dinámico

### ✅ Actualización Automática

- El service worker se actualiza automáticamente
- Los usuarios pueden recibir notificaciones de nuevas versiones

### ✅ Estado Online/Offline

- El hook `useServiceWorker` proporciona el estado de conexión
- Puedes usar `isOnline` para mostrar indicadores visuales

## Uso del Hook useServiceWorker

```typescript
import { useServiceWorker } from "@/src/presentation/hooks/useServiceWorker";

function MyComponent() {
  const { isOnline, isRegistered, updateServiceWorker } = useServiceWorker();

  return (
    <div>
      {!isOnline && <p>Modo offline activo</p>}
      {isRegistered && <p>PWA instalada</p>}
    </div>
  );
}
```

## Verificación

Para verificar que PWA está funcionando:

1. **Chrome DevTools**:

   - Abre DevTools > Application > Manifest
   - Verifica que el manifest se carga correctamente
   - Revisa Service Workers en la pestaña Service Workers

2. **Lighthouse**:

   - Ejecuta Lighthouse en Chrome DevTools
   - Verifica la puntuación PWA (debe ser > 90)

3. **Instalación**:
   - En Chrome/Edge: Busca el ícono de instalación en la barra de direcciones
   - En Android: El navegador mostrará un banner de "Agregar a pantalla de inicio"
   - En iOS Safari: Compartir > Agregar a pantalla de inicio

## Notas Importantes

- El service worker solo funciona en producción o con HTTPS (localhost es una excepción)
- Los cambios en `sw.js` requieren que los usuarios recarguen la página para actualizar
- El cache se limpia automáticamente cuando cambia la versión del service worker
- Las rutas API externas (Firebase, Google Maps) no se cachean por seguridad

## Próximos Pasos (Opcional)

1. Crear los iconos faltantes (`icon-192.png`, `icon-512.png`)
2. Agregar página offline personalizada (`public/offline.html`)
3. Implementar notificaciones push (requiere configuración adicional)
4. Agregar indicadores visuales de estado offline en la UI
5. Implementar sincronización de datos offline (según requerimientos del proyecto)
