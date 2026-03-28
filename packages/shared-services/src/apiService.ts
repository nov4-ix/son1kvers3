/**
 * Generic API Service - Base service for API calls
 * Provides common functionality for all API services
 */
export interface ApiServiceConfig {
  baseUrl: string;
  secret?: string;
  headers?: Record<string, string>;
}

export class ApiService {
  protected config: ApiServiceConfig;

  constructor(config: ApiServiceConfig) {
    this.config = config;
  }

  /**
   * Get default headers
   */
  protected getHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers,
      ...additionalHeaders
    };

    if (this.config.secret) {
      headers['Authorization'] = `Bearer ${this.config.secret}`;
    }

    return headers;
  }

  /**
   * Make GET request
   */
  protected async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(options?.headers as Record<string, string>),
      ...options
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Make POST request
   */
  protected async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(options?.headers as Record<string, string>),
      body: data ? JSON.stringify(data) : undefined,
      ...options
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: { message: `HTTP error! status: ${response.status}` } 
      }));
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Make PATCH request
   */
  protected async patch<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(options?.headers as Record<string, string>),
      body: data ? JSON.stringify(data) : undefined,
      ...options
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Make DELETE request
   */
  protected async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(options?.headers as Record<string, string>),
      ...options
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Make PUT request
   */
  protected async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(options?.headers as Record<string, string>),
      body: data ? JSON.stringify(data) : undefined,
      ...options
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }
}

