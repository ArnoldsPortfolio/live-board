export const BACKEND = "http://127.0.0.1:8010";
export const API = "/api";

export function saveTokens(access: string, refresh: string, email: string): void {
  localStorage.setItem("access", access);
  localStorage.setItem("refresh", refresh);
  localStorage.setItem("email", email);
}
export function token(): string | null {
  return localStorage.getItem("access");
}
export function clearSession(): void {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("email");
}
async function refreshAccess(): Promise<boolean> {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) return false;
  const res = await fetch(`${API}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  if (!res.ok) { clearSession(); return false; }
  const body = await res.json();
  localStorage.setItem("access", body.access_token);
  localStorage.setItem("refresh", body.refresh_token);
  return true;
}
export async function signOut(): Promise<void> {
  const refresh = localStorage.getItem("refresh");
  if (refresh) {
    await fetch(`${API}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    }).catch(() => undefined);
  }
  clearSession();
}
export async function api<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const access = token();
  if (access) headers.set("Authorization", `Bearer ${access}`);
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, { ...init, headers });
  } catch {
    throw new Error("Cannot reach the UI proxy at /api. Is npm run dev running?");
  }
  if (res.status === 401 && !retried) {
    const ok = await refreshAccess();
    if (ok) return api<T>(path, init, true);
    if (typeof window !== "undefined") window.location.href = "/login";
  }
  const text = await res.text();
  let data: { message?: string; detail?: string; code?: string } = {};
  try { data = text ? JSON.parse(text) : {}; } catch {
    throw new Error(text.slice(0, 120) || `HTTP ${res.status}`);
  }
  if (!res.ok) throw new Error(data.message ?? (typeof data.detail === "string" ? data.detail : undefined) ?? data.code ?? "request failed");
  return data as T;
}
