"use client";

import { useIdentityVerification } from "@/src/presentation/hooks/useIdentityVerification";
import { LoaderWithText } from "@/src/presentation/components/ui/Loader";
import { IdentityVerificationConfig } from "@/src/infrastructure/api/IdentityVerificationClient";

interface IdentityVerificationDisclaimerProps {
  config?: IdentityVerificationConfig | Partial<IdentityVerificationConfig> | {}; // Opcional, las credenciales se leen del servidor
}

export function IdentityVerificationDisclaimer({
  config,
}: IdentityVerificationDisclaimerProps) {
  const {
    isVerified,
    isPending,
    isFailed,
    isBlocked,
    attempts,
    startVerification,
    loading,
    error,
  } = useIdentityVerification(config);

  // No mostrar si está verificado
  if (isVerified) {
    return null;
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0"
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
          <h3 className="text-sm font-semibold text-amber-800 mb-1">
            Validación de Identidad Requerida
          </h3>
          <p className="text-sm text-amber-700 mb-3">
            {isPending
              ? "Tu validación de identidad está en proceso. Por favor, completa el proceso para acceder a todas las funcionalidades."
              : isFailed
              ? `Tu validación de identidad falló (${attempts}/3 intentos). Puedes intentar nuevamente.`
              : isBlocked
              ? "Tu cuenta está bloqueada por múltiples intentos fallidos. Por favor, contacta soporte."
              : "Para continuar como multiplicador, necesitas validar tu identidad. Este proceso es rápido y seguro."}
          </p>
          {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
          <button
            onClick={startVerification}
            disabled={loading || isBlocked}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            aria-label="Iniciar validación de identidad"
          >
            {loading ? (
              <LoaderWithText text="Iniciando..." color="white" />
            ) : isPending ? (
              "Revisar Estado"
            ) : isFailed ? (
              "Reintentar Validación"
            ) : (
              "Validar Identidad"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
