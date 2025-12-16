"use client";

import { useEffect, useState } from "react";

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isOnline: boolean;
  registration: ServiceWorkerRegistration | null;
  error: Error | null;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isOnline: navigator.onLine,
    registration: null,
    error: null,
  });

  useEffect(() => {
    // Verificar si el navegador soporta Service Workers
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      setState((prev) => ({ ...prev, isSupported: false }));
      return;
    }

    setState((prev) => ({ ...prev, isSupported: true }));

    // Registrar el Service Worker
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        console.log("[SW] Service Worker registered:", registration);

        // Verificar si ya hay una actualización disponible
        if (registration.waiting) {
          console.log("[SW] New service worker waiting");
        }

        // Escuchar actualizaciones
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                console.log("[SW] New service worker installed");
                // Aquí podrías mostrar una notificación al usuario
                // para que recargue la página y use la nueva versión
              }
            });
          }
        });

        setState((prev) => ({
          ...prev,
          isRegistered: true,
          registration,
        }));

        // Escuchar cambios de estado online/offline
        const handleOnline = () => {
          setState((prev) => ({ ...prev, isOnline: true }));
        };

        const handleOffline = () => {
          setState((prev) => ({ ...prev, isOnline: false }));
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
          window.removeEventListener("online", handleOnline);
          window.removeEventListener("offline", handleOffline);
        };
      } catch (error) {
        console.error("[SW] Service Worker registration failed:", error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error : new Error(String(error)),
        }));
      }
    };

    registerSW();

    // Escuchar mensajes del Service Worker
    const handleMessage = (event: MessageEvent) => {
      console.log("[SW] Message from service worker:", event.data);
      // Aquí puedes manejar mensajes del service worker
      // Por ejemplo, notificaciones de actualización de cache
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, []);

  // Función para actualizar el Service Worker manualmente
  const updateServiceWorker = async () => {
    if (!state.registration) return;

    try {
      await state.registration.update();
      console.log("[SW] Service Worker update check triggered");
    } catch (error) {
      console.error("[SW] Failed to update service worker:", error);
    }
  };

  // Función para forzar la activación de un nuevo Service Worker
  const skipWaiting = () => {
    if (state.registration?.waiting) {
      state.registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
  };

  return {
    ...state,
    updateServiceWorker,
    skipWaiting,
  };
}
