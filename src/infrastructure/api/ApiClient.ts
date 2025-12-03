import { mockServer } from "../mocks/mockServer";

export interface IApiClient {
  post<T>(url: string, data: unknown): Promise<T>;
  get<T>(url: string): Promise<T>;
  put<T>(url: string, data: unknown): Promise<T>;
  delete<T>(url: string): Promise<T>;
}

export class ApiClient implements IApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = "/api") {
    this.baseUrl = baseUrl;
  }

  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    // Si el mock server está habilitado, usar mocks
    if (mockServer.isEnabled()) {
      try {
        const headers = new Headers(options.headers as HeadersInit);
        const body = options.body
          ? JSON.parse(options.body as string)
          : undefined;

        const response = await mockServer.handleRequest(
          options.method || "GET",
          `${this.baseUrl}${url}`,
          body,
          headers
        );

        if (!response.ok) {
          const error = await response
            .json()
            .catch(() => ({ message: "An error occurred" }));
          throw new Error(error.message || "Request failed");
        }

        // Si es un blob (PDF, etc.), retornar directamente
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/pdf")) {
          return (await response.blob()) as unknown as T;
        }

        return response.json();
      } catch (error: any) {
        // Si el mock server falla, continuar con request real
        if (error.message === "Mock server is disabled") {
          // Continuar con request normal
        } else {
          throw error;
        }
      }
    }

    // Request normal (sin mocks o si mock falló)
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "An error occurred" }));
      throw new Error(error.message || "Request failed");
    }

    // Manejar diferentes tipos de respuesta
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/pdf")) {
      return (await response.blob()) as unknown as T;
    }

    return response.json();
  }

  private getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken");
    }
    return null;
  }

  async post<T>(url: string, data: unknown): Promise<T> {
    return this.request<T>(url, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async get<T>(url: string): Promise<T> {
    return this.request<T>(url, {
      method: "GET",
    });
  }

  async put<T>(url: string, data: unknown): Promise<T> {
    return this.request<T>(url, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async delete<T>(url: string): Promise<T> {
    return this.request<T>(url, {
      method: "DELETE",
    });
  }
}
