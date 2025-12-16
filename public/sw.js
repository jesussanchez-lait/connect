// Service Worker para PWA - Connect
const CACHE_NAME = "connect-v1";
const RUNTIME_CACHE = "connect-runtime-v1";

// Archivos estáticos para cachear en la instalación
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/login",
  "/register",
  "/manifest.json",
];

// Estrategia: Cache First para assets estáticos, Network First para API
const CACHE_FIRST_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|eot)$/,
  /\.(?:js|css)$/,
  /\/_next\/static\//,
];

// Instalación del Service Worker
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching static assets");
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[SW] Failed to cache some assets:", err);
      });
    })
  );
  // Activar inmediatamente sin esperar a que se cierren otras pestañas
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map((cacheName) => {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  // Tomar control de todas las pestañas inmediatamente
  return self.clients.claim();
});

// Interceptar requests
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests que no son GET
  if (request.method !== "GET") {
    return;
  }

  // Ignorar requests a APIs externas (Firebase, Google Maps, etc.)
  if (url.origin !== self.location.origin && !url.href.includes("/api/")) {
    return;
  }

  // Cache First para assets estáticos
  if (CACHE_FIRST_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Network First para páginas y API routes
  event.respondWith(networkFirst(request));
});

// Estrategia Cache First: buscar en cache primero, luego red
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error("[SW] Cache First failed:", error);
    // Retornar una respuesta offline básica si es una página HTML
    if (request.headers.get("accept")?.includes("text/html")) {
      return new Response(
        "<html><body><h1>Sin conexión</h1><p>Esta página no está disponible offline.</p></body></html>",
        {
          headers: { "Content-Type": "text/html" },
        }
      );
    }
    throw error;
  }
}

// Estrategia Network First: intentar red primero, luego cache
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log("[SW] Network failed, trying cache:", error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Si es una página HTML y no hay cache, mostrar página offline
    if (request.headers.get("accept")?.includes("text/html")) {
      return new Response(
        '<html><body><h1>Sin conexión</h1><p>Esta página no está disponible offline.</p><a href="/">Volver al inicio</a></body></html>',
        {
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    throw error;
  }
}

// Manejar mensajes del cliente
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data && event.data.type === "CACHE_URLS") {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});
