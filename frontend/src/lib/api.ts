const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";
let accessToken: string | null = null;

export function setAccessToken(token: string | null) { accessToken = token; }

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const response = await fetch(`${API}${path}`, { ...init, headers, credentials: "include", cache: "no-store" });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message ?? `Erro ${response.status} ao acessar a API.`);
  return body as T;
}

export async function refreshSession() {
  const session = await api<{accessToken:string; displayName:string; roles:string[]}>('/auth/refresh', {method:'POST'});
  setAccessToken(session.accessToken);
  return session;
}
