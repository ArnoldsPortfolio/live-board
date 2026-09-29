export const BACKEND = typeof window !== "undefined"
  ? `http://${window.location.hostname}:8010`
  : "http://127.0.0.1:8010";
export const API = BACKEND;

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
  const host = typeof window !== "undefined" ? window.location.hostname : "127.0.0.1";
  const bases = [`http://${host}:8010`, "http://127.0.0.1:8010", "http://localhost:8010"];
  let res: Response | null = null;
  for (const base of bases) {
    try {
      res = await fetch(`${base}${path}`, { ...init, headers });
      break;
    } catch {
      res = null;
    }
  }
  if (!res) throw new Error("Cannot reach API on port 8010. Confirm http://127.0.0.1:8010/health opens.");
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
