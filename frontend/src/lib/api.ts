const BASE_URL = '/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiRequest<T = any>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers = new Headers(options?.headers);
  
  if (!headers.has('Content-Type') && !(options?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Session expired or OAuth missing
    // In local-first, we can redirect or let downstream hooks handle redirecting to integrations/settings page
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(errorData.message || `Request failed with status ${response.status}`, response.status);
  }

  return response.json() as Promise<T>;
}
