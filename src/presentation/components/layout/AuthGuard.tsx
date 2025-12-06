"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/src/presentation/hooks/useAuth";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !isAuthenticated) {
        router.push("/login");
      } else if (!requireAuth && isAuthenticated) {
        // No redirigir al dashboard si:
        // 1. El usuario está en la página de registro (permite completar el registro)
        // 2. El usuario tiene pendingAuth (registro incompleto)
        // 3. El usuario no tiene datos completos (address, department, city)
        const isOnRegisterPage = pathname === "/register";
        const hasPendingAuth = (user as any)?.pendingAuth === true;
        const hasIncompleteData =
          user && (!user.address || !user.department || !user.city);

        // Solo redirigir si el usuario está completamente registrado y no está en registro
        if (!isOnRegisterPage && !hasPendingAuth && !hasIncompleteData) {
          router.push("/dashboard");
        }
      }
    }
  }, [isAuthenticated, loading, requireAuth, router, pathname, user]);

  // Durante la carga, mostrar el contenido con un overlay sutil
  // Esto evita pantallas en blanco durante la transición
  if (loading) {
    return (
      <div className="relative">
        <div className="opacity-50 pointer-events-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75 z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-xs text-gray-600">Verificando acceso...</p>
          </div>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // Si requireAuth es false (página pública) y el usuario está autenticado,
  // verificar si está en proceso de registro antes de ocultar contenido
  if (!requireAuth && isAuthenticated) {
    const isOnRegisterPage = pathname === "/register";
    const hasPendingAuth = (user as any)?.pendingAuth === true;
    const hasIncompleteData =
      user && (!user.address || !user.department || !user.city);

    // Si está en registro o tiene registro incompleto, mostrar el contenido
    if (isOnRegisterPage || hasPendingAuth || hasIncompleteData) {
      return <>{children}</>;
    }

    // Si está completamente registrado, ocultar contenido (será redirigido)
    return null;
  }

  return <>{children}</>;
}
