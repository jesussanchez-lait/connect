/**
 * Cliente para validación de identidad
 * Usa Didit internamente pero se presenta como "Validación de identidad" en la UI
 */

export interface IdentityVerificationConfig {
  appId: string;
  apiKey: string;
  workflowId: string;
}

export interface StartVerificationRequest {
  userId: string;
  documentNumber?: string;
  email?: string;
  phoneNumber?: string;
  callbackUrl?: string;
}

export interface StartVerificationResponse {
  verificationSessionId: string;
  verification_url: string;
  status: "pending" | "in_progress";
}

export interface VerificationStatus {
  workflowId: string;
  status: "pending" | "in_progress" | "verified" | "failed" | "expired";
  result?: {
    verified: boolean;
    score?: number;
    details?: Record<string, unknown>;
  };
  error?: string;
}

export class IdentityVerificationClient {
  private config: IdentityVerificationConfig;
  private baseUrl: string;

  constructor(config?: IdentityVerificationConfig) {
    this.config = config || {
      appId: process.env.NEXT_PUBLIC_DIDIT_APP_ID || "",
      apiKey: process.env.NEXT_PUBLIC_DIDIT_API_KEY || "",
      workflowId: process.env.NEXT_PUBLIC_DIDIT_WORKFLOW_ID || "",
    };

    // Base URL de Didit API v2
    this.baseUrl = process.env.NEXT_PUBLIC_DIDIT_API_URL || "https://api.didit.me/v2";
  }

  /**
   * Inicia un workflow de validación de identidad
   */
  async startVerification(
    request: StartVerificationRequest
  ): Promise<StartVerificationResponse> {
    try {
      // Construir callback URL si no se proporciona
      const callbackUrl =
        request.callbackUrl ||
        `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/identity-verification/callback`;

      // Preparar payload para Didit API v2 - Create Verification Session
      // Según documentación: https://docs.didit.me/reference/web-app
      const payload = {
        workflow_id: this.config.workflowId,
        callback: callbackUrl,
        metadata: {
          user_id: request.userId,
          document_number: request.documentNumber,
          email: request.email,
          phone_number: request.phoneNumber,
        },
      };

      // Llamar a la API de Didit - Create Verification Session
      const response = await fetch(`${this.baseUrl}/verification-sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.apiKey}`,
          "X-App-Id": this.config.appId,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "Error al iniciar validación de identidad",
        }));
        throw new Error(error.message || "Error al iniciar validación de identidad");
      }

      const data = await response.json();

      // La API de Didit devuelve verification_url (con guión bajo) según documentación
      return {
        verificationSessionId: data.id || data.verificationSessionId || data.session_id,
        verification_url: data.verification_url || data.verificationUrl || data.url,
        status: "pending",
      };
    } catch (error: any) {
      console.error("[IdentityVerificationClient] Error al iniciar verificación:", error);
      throw new Error(
        error.message || "Error al iniciar el proceso de validación de identidad"
      );
    }
  }

  /**
   * Verifica el estado de una sesión de verificación
   */
  async checkStatus(verificationSessionId: string): Promise<VerificationStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/verification-sessions/${verificationSessionId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.apiKey}`,
          "X-App-Id": this.config.appId,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "Error al verificar estado",
        }));
        throw new Error(error.message || "Error al verificar estado de validación");
      }

      const data = await response.json();

      return {
        workflowId: verificationSessionId, // Mantener compatibilidad
        status: this.mapDiditStatus(data.status),
        result: data.result,
        error: data.error,
      };
    } catch (error: any) {
      console.error("[IdentityVerificationClient] Error al verificar estado:", error);
      throw new Error(
        error.message || "Error al verificar el estado de validación de identidad"
      );
    }
  }

  /**
   * Mapea el estado de Didit a nuestro formato interno
   * Según documentación: status puede ser "Approved", "Declined", "In Review"
   */
  private mapDiditStatus(
    diditStatus: string
  ): "pending" | "in_progress" | "verified" | "failed" | "expired" {
    const statusMap: Record<string, "pending" | "in_progress" | "verified" | "failed" | "expired"> =
      {
        pending: "pending",
        "in-progress": "in_progress",
        "in_progress": "in_progress",
        "in review": "in_progress",
        "in_review": "in_progress",
        verified: "verified",
        approved: "verified",
        "Approved": "verified",
        failed: "failed",
        rejected: "failed",
        declined: "failed",
        "Declined": "failed",
        expired: "expired",
      };

    return statusMap[diditStatus] || statusMap[diditStatus.toLowerCase()] || "pending";
  }

  /**
   * Valida la configuración del cliente
   */
  validateConfig(): boolean {
    return !!(
      this.config.appId &&
      this.config.apiKey &&
      this.config.workflowId
    );
  }
}

