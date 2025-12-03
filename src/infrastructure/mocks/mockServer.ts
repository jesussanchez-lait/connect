// Mock Server - Intercepta requests y retorna datos mock

import { authHandlers, dashboardHandlers } from "./mockHandlers";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false"; // Por defecto true en desarrollo

export class MockServer {
  private static instance: MockServer;
  private enabled: boolean;

  private constructor() {
    this.enabled = USE_MOCKS;
  }

  static getInstance(): MockServer {
    if (!MockServer.instance) {
      MockServer.instance = new MockServer();
    }
    return MockServer.instance;
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async handleRequest(
    method: string,
    url: string,
    body?: any,
    headers?: Headers
  ): Promise<Response> {
    if (!this.enabled) {
      throw new Error("Mock server is disabled");
    }

    // Extraer token del header Authorization (case-insensitive)
    const authHeader =
      headers?.get("authorization") || headers?.get("Authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    try {
      // Parse URL
      const urlObj = new URL(url, "http://localhost:3000");
      const pathname = urlObj.pathname;
      const searchParams = urlObj.searchParams;

      // Auth routes
      if (pathname === "/api/auth/send-otp" && method === "POST") {
        const result = await authHandlers.sendOtp(body.phoneNumber);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (pathname === "/api/auth/verify-otp" && method === "POST") {
        const result = await authHandlers.verifyOtp(
          body.phoneNumber,
          body.otpCode
        );
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (pathname === "/api/auth/register" && method === "POST") {
        const result = await authHandlers.register(body);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (pathname === "/api/auth/logout" && method === "POST") {
        const result = await authHandlers.logout();
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (pathname === "/api/auth/me" && method === "GET") {
        const result = await authHandlers.getCurrentUser(token);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Dashboard routes
      if (pathname === "/api/dashboard/campaigns" && method === "GET") {
        const result = await dashboardHandlers.getCampaigns(token);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (
        pathname.startsWith("/api/dashboard/campaigns/") &&
        method === "GET"
      ) {
        const campaignId = pathname.split("/").pop();
        if (!campaignId) {
          return new Response(
            JSON.stringify({ message: "campaignId es requerido" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        const result = await dashboardHandlers.getCampaignDetail(
          campaignId,
          token
        );
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (pathname === "/api/dashboard/my-team" && method === "GET") {
        const campaignId = searchParams.get("campaignId");
        if (!campaignId) {
          return new Response(
            JSON.stringify({ message: "campaignId es requerido" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        const result = await dashboardHandlers.getMyTeam(campaignId, token);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (pathname === "/api/dashboard/my-team" && method === "POST") {
        const result = await dashboardHandlers.addTeamMember(body, token);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (pathname === "/api/dashboard/my-leader" && method === "GET") {
        const campaignId = searchParams.get("campaignId");
        if (!campaignId) {
          return new Response(
            JSON.stringify({ message: "campaignId es requerido" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        const result = await dashboardHandlers.getMyLeader(campaignId, token);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (pathname === "/api/dashboard/qr-code" && method === "GET") {
        const campaignId = searchParams.get("campaignId");
        if (!campaignId) {
          return new Response(
            JSON.stringify({ message: "campaignId es requerido" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        const result = await dashboardHandlers.getQRCode(campaignId, token);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (pathname === "/api/dashboard/activities" && method === "GET") {
        const campaignId = searchParams.get("campaignId");
        if (!campaignId) {
          return new Response(
            JSON.stringify({ message: "campaignId es requerido" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        const result = await dashboardHandlers.getActivities(campaignId, token);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (pathname === "/api/dashboard/campaign-proposal" && method === "GET") {
        const campaignId = searchParams.get("campaignId");
        if (!campaignId) {
          return new Response(
            JSON.stringify({ message: "campaignId es requerido" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        const result = await dashboardHandlers.getCampaignProposal(
          campaignId,
          token
        );
        return new Response(result, {
          status: 200,
          headers: { "Content-Type": "application/pdf" },
        });
      }

      // COORDINATOR specific routes
      if (pathname === "/api/dashboard/fraud-alerts" && method === "GET") {
        const result = await dashboardHandlers.getFraudAlerts(token);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (pathname === "/api/dashboard/divorce-requests" && method === "GET") {
        const result = await dashboardHandlers.getDivorceRequests(token);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (
        pathname.startsWith("/api/dashboard/divorce-requests/") &&
        method === "POST"
      ) {
        const divorceId = pathname.split("/").pop();
        if (!divorceId) {
          return new Response(
            JSON.stringify({ message: "divorceId es requerido" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        const result = await dashboardHandlers.approveDivorce(divorceId, token);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Route not found
      return new Response(JSON.stringify({ message: "Ruta no encontrada" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(
        JSON.stringify({
          message: error.message || "Error interno del servidor",
        }),
        {
          status: error.message?.includes("No autorizado") ? 401 : 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }
}

export const mockServer = MockServer.getInstance();
