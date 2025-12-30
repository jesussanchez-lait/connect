"use client";

import { useIdentityVerification } from "@/src/presentation/hooks/useIdentityVerification";
import { LoaderWithText } from "@/src/presentation/components/ui/Loader";

export function IdentityVerificationBanner() {
  const {
    isPending,
    isVerified,
    isFailed,
    isBlocked,
    attempts,
    startVerification,
    loading,
    error,
  } = useIdentityVerification();

  // No mostrar si está verificado, bloqueado, o nunca inició validación
  if (isVerified || isBlocked || (!isPending && !isFailed)) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <svg
            className="w-5 h-5 text-yellow-600 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-yellow-800">
              {isPending
                ? "Validación de identidad pendiente"
                : isFailed
                ? `Validación de identidad fallida (${attempts}/3 intentos)`
                : "Validación de identidad no completada"}
            </p>
            <p className="text-xs text-yellow-700 mt-0.5">
              {isPending
                ? "Completa la validación de identidad para acceder a todas las funcionalidades"
                : isFailed
                ? "Puedes intentar nuevamente. Después de 3 intentos fallidos, tu cuenta será bloqueada."
                : "Completa la validación de identidad para mayor seguridad"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {error && (
            <p className="text-xs text-red-600 mr-2">{error}</p>
          )}
          <button
            onClick={startVerification}
            disabled={loading || isBlocked}
            className="px-4 py-2 text-sm font-medium text-yellow-800 bg-yellow-100 rounded-lg hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {loading ? (
              <LoaderWithText text="Iniciando..." color="white" />
            ) : isFailed ? (
              "Reintentar Validación"
            ) : (
              "Iniciar Validación"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

