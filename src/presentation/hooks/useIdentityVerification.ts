import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { verifyIdentityUseCase } from "@/src/shared/di/container";
import { authRepository } from "@/src/shared/di/container";

export function useIdentityVerification() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startVerification = async () => {
    if (!user?.id) {
      setError("Usuario no autenticado");
      return;
    }

    // Verificar intentos previos
    if (user.identityVerificationAttempts && user.identityVerificationAttempts >= 3) {
      setError("Has alcanzado el límite de intentos. Tu cuenta ha sido bloqueada.");
      return;
    }

    if (user.isBlocked) {
      setError("Tu cuenta está bloqueada. Por favor, contacta soporte.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await verifyIdentityUseCase.execute(user.id);
      
      // Refrescar usuario para obtener el workflowId actualizado
      await refreshUser();
      
      return result;
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
      const status = await authRepository.checkIdentityVerificationStatus(workflowId);
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

