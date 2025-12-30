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
  workflowId: string;
  verificationUrl?: string;
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

    // Base URL de Didit API (ajustar según documentación real)
    this.baseUrl = process.env.NEXT_PUBLIC_DIDIT_API_URL || "https://api.didit.io/v1";
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

      // Preparar payload para Didit API
      const payload = {
        appId: this.config.appId,
        workflowId: this.config.workflowId,
        userId: request.userId,
        metadata: {
          documentNumber: request.documentNumber,
          email: request.email,
          phoneNumber: request.phoneNumber,
        },
        callbackUrl,
      };

      // Llamar a la API de Didit
      const response = await fetch(`${this.baseUrl}/workflows/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.config.apiKey,
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

      return {
        workflowId: data.workflowId || data.id,
        verificationUrl: data.verificationUrl || data.url,
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
   * Verifica el estado de un workflow de validación
   */
  async checkStatus(workflowId: string): Promise<VerificationStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/workflows/${workflowId}/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.config.apiKey,
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
        workflowId,
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
   */
  private mapDiditStatus(
    diditStatus: string
  ): "pending" | "in_progress" | "verified" | "failed" | "expired" {
    const statusMap: Record<string, "pending" | "in_progress" | "verified" | "failed" | "expired"> =
      {
        pending: "pending",
        "in-progress": "in_progress",
        "in_progress": "in_progress",
        verified: "verified",
        approved: "verified",
        failed: "failed",
        rejected: "failed",
        expired: "expired",
      };

    return statusMap[diditStatus.toLowerCase()] || "pending";
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

