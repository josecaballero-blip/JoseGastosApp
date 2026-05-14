// ═══════════════════════════════════════════════
// API CLIENT (Equivalente a APIClient.swift genérico)
// URLSession + Combine → fetch + async/await
// ═══════════════════════════════════════════════

import { supabase } from '../../lib/supabase';

// ── API ERRORS (Equivalente a APIError.swift) ──
export class APIError extends Error {
  code: number;
  constructor(message: string, code: number = 500) {
    super(message);
    this.code = code;
    this.name = 'APIError';
  }
}

export const APIErrors = {
  unauthorized: new APIError('No autorizado', 401),
  notFound: new APIError('Recurso no encontrado', 404),
  serverError: new APIError('Error del servidor', 500),
  networkError: new APIError('Sin conexión a internet', 0),
  decodingError: new APIError('Error al procesar la respuesta', 422),
};

// ── API CLIENT CON RETRY + BACKOFF (Equivalente a APIClient.swift) ──
export class APIClient {
  private static instance: APIClient;
  private maxRetries = 3;

  static shared(): APIClient {
    if (!APIClient.instance) APIClient.instance = new APIClient();
    return APIClient.instance;
  }

  /// Request genérico con retry automático y exponential backoff
  async request<T>(
    table: string,
    method: 'select' | 'insert' | 'update' | 'upsert' | 'delete',
    options?: {
      data?: any;
      filters?: Record<string, any>;
      order?: { column: string; ascending?: boolean };
      limit?: number;
      single?: boolean;
    }
  ): Promise<T> {
    let lastError: Error = new Error('Unknown');

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        let query: any = supabase.from(table);

        switch (method) {
          case 'select':
            query = query.select(options?.data || '*');
            break;
          case 'insert':
            query = query.insert(options?.data);
            break;
          case 'update':
            query = query.update(options?.data);
            break;
          case 'upsert':
            query = query.upsert(options?.data);
            break;
          case 'delete':
            query = query.delete();
            break;
        }

        // Aplicar filtros
        if (options?.filters) {
          for (const [key, value] of Object.entries(options.filters)) {
            query = query.eq(key, value);
          }
        }

        // Ordenar
        if (options?.order) {
          query = query.order(options.order.column, { ascending: options.order.ascending ?? false });
        }

        // Limitar
        if (options?.limit) {
          query = query.limit(options.limit);
        }

        // Single
        if (options?.single) {
          query = query.single();
        }

        const { data, error } = await query;

        if (error) {
          if (error.code === 'PGRST116') throw APIErrors.notFound;
          if (error.message?.includes('JWT')) throw APIErrors.unauthorized;
          throw new APIError(error.message, parseInt(error.code) || 500);
        }

        if (__DEV__) {
          console.log(`📡 [${method.toUpperCase()}] ${table}`, data ? `(${Array.isArray(data) ? data.length : 1} items)` : '');
        }

        return data as T;
      } catch (error: any) {
        lastError = error;

        // No reintentar en errores de autenticación
        if (error.code === 401) throw error;

        // Exponential backoff
        if (attempt < this.maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          if (__DEV__) console.log(`🔄 Reintentando en ${delay}ms (intento ${attempt + 1}/${this.maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }
}

// ── AUTH INTERCEPTOR (Equivalente a AuthInterceptor.swift) ──
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw APIErrors.unauthorized;
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

/// Para llamadas al backend de Node.js (exportaciones, etc.)
export async function fetchBackend<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders();
  const BACKEND_URL = 'http://localhost:3000'; // Cambiar en producción

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });

  if (!response.ok) {
    throw new APIError(`Backend error: ${response.statusText}`, response.status);
  }

  return response.json();
}
