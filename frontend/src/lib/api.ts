import type { ApiResponse } from "./types";
import { safeStorage } from "./utils";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
const MAX_RETRIES = 2;

class ApiClient {
  private accessToken: string | null = null;
  private tenantId: string | null = null;
  private refreshPromise: Promise<boolean> | null = null;

  setToken(token: string | null) {
    this.accessToken = token;
  }

  setTenantId(id: string | null) {
    this.tenantId = id;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
    retryCount = 0,
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    if (this.tenantId) {
      headers["x-tenant-id"] = this.tenantId;
    }

    let res: Response;
    try {
      res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
      });
    } catch (err) {
      // Network error — retry on GET/idempotent
      if (retryCount < MAX_RETRIES && (!options.method || options.method === "GET")) {
        await this.delay(1000 * (retryCount + 1));
        return this.request<T>(path, options, retryCount + 1);
      }
      throw new ApiError("Network error — please check your connection", 0, null);
    }

    // Auto-refresh token on 401
    if (res.status === 401 && retryCount === 0 && path !== "/auth/refresh" && path !== "/auth/login") {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        return this.request<T>(path, options, retryCount + 1);
      }
    }

    let json: any;
    try {
      json = await res.json();
    } catch {
      throw new ApiError("Invalid response from server", res.status, null);
    }

    if (!res.ok) {
      const message = Array.isArray(json.message)
        ? json.message.join(", ")
        : json.message || "Request failed";
      throw new ApiError(message, res.status, json);
    }

    // Unwrap { data } if backend wraps response
    if (json && typeof json === "object" && "data" in json && !Array.isArray(json)) {
      return json.data as T;
    }

    return json as T;
  }

  private async tryRefreshToken(): Promise<boolean> {
    // Deduplicate concurrent refresh attempts
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = this.executeRefresh();
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async executeRefresh(): Promise<boolean> {
    const refreshToken = safeStorage.getItem("refreshToken");

    if (!refreshToken) return false;

    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return false;

      const json = await res.json();
      const data = json.data || json;

      if (data?.accessToken) {
        this.accessToken = data.accessToken;
        safeStorage.setItem("accessToken", data.accessToken);
        if (data.refreshToken) {
          safeStorage.setItem("refreshToken", data.refreshToken);
        }
        return true;
      }
    } catch {
      // Refresh failed — user needs to re-login
    }

    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" });
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: any,
  ) {
    super(Array.isArray(message) ? message.join(", ") : message);
    this.name = "ApiError";
  }
}

export const api = new ApiClient();
