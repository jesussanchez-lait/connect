import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { verifyIdentityUseCase } from "@/src/shared/di/container";
import { authRepository } from "@/src/shared/di/container";
import { IdentityVerificationConfig } from "@/src/infrastructure/api/IdentityVerificationClient";

export function useIdentityVerification(
  customConfig?: IdentityVerificationConfig
) {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startVerification = async () => {
    if (!user?.id) {
      setError("Usuario no autenticado");
      return;
    }

    // Verificar intentos previos
    if (
      user.identityVerificationAttempts &&
      user.identityVerificationAttempts >= 3
    ) {
      setError(
        "Has alcanzado el límite de intentos. Tu cuenta ha sido bloqueada."
      );
      return;
    }

    if (user.isBlocked) {
      setError("Tu cuenta está bloqueada. Por favor, contacta soporte.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Si hay configuración personalizada (incluso si está vacía), usar endpoint del servidor
      // El servidor leerá las credenciales desde variables de entorno
      if (customConfig !== undefined) {
        if (typeof window === "undefined") {
          throw new Error("Este hook solo funciona en el cliente");
        }

        // Llamar a nuestro endpoint API que hace la llamada a Didit desde el servidor
        // El servidor leerá las credenciales desde .env automáticamente
        const response = await fetch("/api/identity-verification/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            // Ya no enviamos credenciales desde el cliente por seguridad
            // El servidor las lee desde variables de entorno
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            message: "Error al iniciar validación de identidad",
          }));

          console.error("[Identity Verification Error]:", {
            status: response.status,
            error: errorData,
          });

          // Mostrar mensaje más descriptivo al usuario
          const errorMessage = errorData.details?.message
            ? `${errorData.message}: ${errorData.details.message}`
            : errorData.message || "Error al iniciar validación de identidad";

          throw new Error(errorMessage);
        }

        const verification = await response.json();

        // Si hay una URL de verificación, redirigir según documentación de Didit
        // Usar window.location.assign() para redirect button según docs.didit.me
        if (verification.verification_url) {
          // Opción 1: Redirect button (recomendado por Didit para cross-device flows)
          window.location.assign(verification.verification_url);

          // Opción 2: Si se prefiere nueva ventana (comentado)
          // window.open(verification.verification_url, "_blank", "width=800,height=600");
        }

        // Refrescar usuario para obtener el workflowId actualizado
        await refreshUser();

        return {
          workflowId: verification.verificationSessionId, // Mantener compatibilidad
        };
      } else {
        // Usar el caso de uso estándar
        const result = await verifyIdentityUseCase.execute(user.id);

        // Refrescar usuario para obtener el workflowId actualizado
        await refreshUser();

        return result;
      }
    } catch (err: any) {
      setError(err.message || "Error al iniciar validación de identidad");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async (workflowId: string) => {
    if (!workflowId) {
      return null;
    }

    try {
      const status = await authRepository.checkIdentityVerificationStatus(
        workflowId
      );
      await refreshUser();
      return status;
    } catch (err: any) {
      console.error("Error checking verification status:", err);
      return null;
    }
  };

  return {
    user,
    loading,
    error,
    startVerification,
    checkStatus,
    isPending: user?.identityVerificationStatus === "pending",
    isVerified: user?.identityVerificationStatus === "verified",
    isFailed: user?.identityVerificationStatus === "failed",
    isBlocked: user?.isBlocked || false,
    attempts: user?.identityVerificationAttempts || 0,
    workflowId: user?.identityVerificationWorkflowId,
  };
}
