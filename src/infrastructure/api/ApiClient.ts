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
