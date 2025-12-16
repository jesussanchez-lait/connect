"use client";

import { useEffect } from "react";
import { useServiceWorker } from "@/src/presentation/hooks/useServiceWorker";

export function ServiceWorkerRegistration() {
  const { isSupported, isRegistered, isOnline, error } = useServiceWorker();

  useEffect(() => {
    if (error) {
      console.error("[SW] Service Worker error:", error);
    }
  }, [error]);

  // Este componente no renderiza nada visualmente
  // Solo registra el service worker en segundo plano
  return null;
}
