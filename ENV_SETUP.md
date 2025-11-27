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

## Notas Importantes

- El archivo `.env.local` está en `.gitignore` y no se subirá al repositorio
- Después de crear o modificar `.env.local`, reinicia el servidor de desarrollo
- Las variables que empiezan con `NEXT_PUBLIC_` son accesibles en el cliente (navegador)
- No compartas tu API key públicamente
