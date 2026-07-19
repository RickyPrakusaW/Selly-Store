import type { ApiEnvelope, Category, Product, User } from './types';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

let accessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

async function read<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as
    | ApiEnvelope<T>
    | { message?: string }
    | null;
  if (!response.ok) {
    throw new ApiError(body?.message ?? 'Permintaan tidak dapat diproses.', response.status);
  }
  return (body as ApiEnvelope<T>).data;
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-CSRF-Token': 'refresh' },
    })
      .then(async (response) => {
        if (!response.ok) return false;
        const data = await read<{ accessToken: string }>(response);
        setAccessToken(data.accessToken);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });
  if (response.status === 401 && retry && (await refreshAccessToken())) {
    return apiRequest<T>(path, init, false);
  }
  return read<T>(response);
}

export async function fetchProducts(search = '', category = ''): Promise<Product[]> {
  const params = new URLSearchParams({ page: '1', limit: '24' });
  if (search) params.set('search', search);
  if (category) params.set('category', category);
  return apiRequest<Product[]>(`/products?${params.toString()}`);
}

export const fetchCategories = () => apiRequest<Category[]>('/categories');
export const fetchMe = () => apiRequest<User>('/auth/me');
