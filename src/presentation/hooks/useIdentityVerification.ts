import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { verifyIdentityUseCase } from "@/src/shared/di/container";
import { authRepository } from "@/src/shared/di/container";
import { IdentityVerificationClient, IdentityVerificationConfig } from "@/src/infrastructure/api/IdentityVerificationClient";
import { db } from "@/src/infrastructure/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

export function useIdentityVerification(customConfig?: IdentityVerificationConfig) {
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
      // Si hay configuración personalizada, usar el cliente directamente
      if (customConfig) {
        if (typeof window === "undefined" || !db) {
          throw new Error("Firestore no está inicializado");
        }

        const client = new IdentityVerificationClient(customConfig);

        if (!client.validateConfig()) {
          throw new Error("Configuración de validación de identidad incompleta");
        }

        // Obtener datos del usuario
        const userDocRef = doc(db, "users", user.id);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          throw new Error("Usuario no encontrado");
        }

        const userData = userDoc.data();

        // Iniciar workflow de validación con configuración personalizada
        const verification = await client.startVerification({
          userId: user.id,
          documentNumber: userData.documentNumber,
          email: userData.email,
          phoneNumber: userData.phoneNumber,
        });

        // Si hay una URL de verificación, abrirla en una nueva ventana
        if (verification.verificationUrl) {
          window.open(verification.verificationUrl, "_blank", "width=800,height=600");
        }

        // Actualizar usuario con workflow ID
        await updateDoc(userDocRef, {
          identityVerificationWorkflowId: verification.workflowId,
          identityVerificationStatus: "pending",
          identityVerificationAttempts: (userData.identityVerificationAttempts || 0) + 1,
          updatedAt: serverTimestamp(),
        });

        // Refrescar usuario para obtener el workflowId actualizado
        await refreshUser();

        return {
          workflowId: verification.workflowId,
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

