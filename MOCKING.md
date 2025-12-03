# Sistema de Mocking - CONNECT

Este documento explica cómo funciona el sistema de mocking en CONNECT y cómo usarlo.

## Configuración

El sistema de mocking está habilitado por defecto en desarrollo. Para controlarlo, usa la variable de entorno:

```env
NEXT_PUBLIC_USE_MOCKS=true  # true por defecto, false para desactivar
```

## Estructura

El sistema de mocking está organizado en tres archivos principales:

### 1. `src/infrastructure/mocks/mockData.ts`

Contiene todos los datos mock estáticos:

- Usuarios por rol
- Campañas
- Equipos y jerarquías
- Actividades
- Alertas de fraude
- Solicitudes de divorcio
- Credenciales de prueba

### 2. `src/infrastructure/mocks/mockHandlers.ts`

Contiene los handlers que simulan las respuestas de la API:

- `authHandlers`: Autenticación (sendOtp, verifyOtp, register, logout, getCurrentUser)
- `dashboardHandlers`: Dashboard (campaigns, team, leader, QR, activities, etc.)

Cada handler:

- Simula delays de red (100-500ms)
- Valida permisos según rol
- Retorna datos consistentes
- Maneja errores apropiadamente

### 3. `src/infrastructure/mocks/mockServer.ts`

Servidor mock que intercepta requests y los dirige a los handlers correspondientes.

## Cómo Funciona

1. **ApiClient** verifica si el mock server está habilitado
2. Si está habilitado, intercepta el request y lo envía al `mockServer`
3. El `mockServer` parsea la URL y método, y llama al handler correspondiente
4. El handler retorna datos mock consistentes
5. Si el mock falla, el sistema hace fallback al request real

## Identificación de Usuarios

El sistema mock identifica usuarios por token:

1. Cuando un usuario hace login (`verifyOtp`), se genera un token mock: `mock-token-{userId}-{timestamp}`
2. El token se mapea al usuario en `tokenToUserMap`
3. En requests subsiguientes, el token se extrae del header `Authorization`
4. El usuario se identifica desde el mapa de tokens

## Datos Mock Disponibles

### Usuarios

- `MOCK_USERS.SUPER_ADMIN`
- `MOCK_USERS.ADMIN`
- `MOCK_USERS.COORDINATOR`
- `MOCK_USERS.LINK`
- `MOCK_USERS.MULTIPLIER`
- `MOCK_USERS.FOLLOWER`

### Campañas

- `MOCK_CAMPAIGNS`: Array con 2 campañas de ejemplo

### Equipos

- `MOCK_TEAM_MEMBERS.multiplierTeam`: 15 seguidores del MULTIPLIER
- `MOCK_TEAM_MEMBERS.linkMultipliers`: 3 multiplicadores bajo LINK

### Otros

- `MOCK_ACTIVITIES`: Historial de actividades
- `MOCK_FRAUD_ALERTS`: Alertas de fraude (para COORDINATOR)
- `MOCK_DIVORCE_REQUESTS`: Solicitudes de divorcio (para COORDINATOR)

## Helpers Disponibles

### `getUserByPhone(phoneNumber: string)`

Busca un usuario por número de teléfono.

### `getOtpByPhone(phoneNumber: string)`

Obtiene el código OTP para un número de teléfono.

### `generateQRData(userId: string, campaignId: string)`

Genera la URL del código QR para un usuario y campaña.

## Endpoints Mockeados

### Autenticación

- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Dashboard

- `GET /api/dashboard/campaigns`
- `GET /api/dashboard/my-team?campaignId={id}`
- `POST /api/dashboard/my-team`
- `GET /api/dashboard/my-leader?campaignId={id}`
- `GET /api/dashboard/qr-code?campaignId={id}`
- `GET /api/dashboard/activities?campaignId={id}`
- `GET /api/dashboard/campaign-proposal?campaignId={id}`

### COORDINATOR Específicos

- `GET /api/dashboard/fraud-alerts`
- `GET /api/dashboard/divorce-requests`
- `POST /api/dashboard/divorce-requests/{id}`

## Permisos por Rol

Los handlers validan permisos según el rol:

- **MULTIPLIER**: Puede ver su equipo, QR code, agregar miembros
- **LINK**: Puede ver multiplicadores bajo su gestión
- **COORDINATOR**: Puede ver alertas de fraude y aprobar divorcios
- **ADMIN**: Puede ver todas las campañas y exportar datos
- **FOLLOWER**: Solo lectura, sin capacidad de reclutar

## Extender los Mocks

Para agregar nuevos datos mock:

1. Agregar datos en `mockData.ts`
2. Crear handler en `mockHandlers.ts`
3. Agregar ruta en `mockServer.ts`

Ejemplo:

```typescript
// En mockData.ts
export const MOCK_NEW_DATA = [{ id: "1", name: "Ejemplo" }];

// En mockHandlers.ts
export const newHandlers = {
  async getNewData(token: string | null) {
    await delay(200);
    if (!token) throw new Error("No autorizado");
    return MOCK_NEW_DATA;
  },
};

// En mockServer.ts
if (pathname === "/api/new-endpoint" && method === "GET") {
  const result = await newHandlers.getNewData(token);
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
```

## Debugging

Para debuggear los mocks:

1. Abre las DevTools del navegador
2. Ve a la pestaña Network
3. Los requests mockeados aparecerán como requests normales
4. Revisa la consola para logs de errores
5. Los datos mock están disponibles en `mockData.ts` para inspección

## Desactivar Mocks

Para desactivar los mocks y usar el backend real:

1. Crea o edita `.env.local`
2. Agrega: `NEXT_PUBLIC_USE_MOCKS=false`
3. Reinicia el servidor de desarrollo

## Notas

- Los mocks simulan delays de red realistas
- Los datos son consistentes entre endpoints
- Las relaciones jerárquicas se mantienen
- Los permisos se validan correctamente
- Los errores se manejan apropiadamente
