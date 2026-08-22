/**
 * The demo's HTTP client: a thin `fetch` wrapper, deliberately not the axios +
 * auth-interceptor client a real app would use.
 *
 * The engine never talks to a server itself — a descriptor's `api` functions
 * do — so a demo needs nothing more than this to prove the wiring.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type QueryValue = string | number | boolean | undefined;

function withQuery(path: string, params?: Record<string, QueryValue>): string {
  if (!params) {
    return path;
  }

  const search = new URLSearchParams();

  // An undefined param is dropped rather than sent empty: the handlers read a
  // missing `sortField` as "natural order", which an empty string is not.
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      search.set(key, String(value));
    }
  }

  const query = search.toString();

  return query ? `${path}?${query}` : path;
}

async function request<T>(method: string, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { method, ...init });

  if (!response.ok) {
    throw new ApiError(response.status, `${method} ${path} failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

export const apiClient = {
  get<T>(path: string, o: { params?: Record<string, QueryValue>; signal?: AbortSignal } = {}) {
    return request<T>("GET", withQuery(path, o.params), { signal: o.signal });
  },

  patch<T>(path: string, body: unknown) {
    return request<T>("PATCH", path, {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  },

  post<T>(path: string) {
    return request<T>("POST", path);
  },
};
