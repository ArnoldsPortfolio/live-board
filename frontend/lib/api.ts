export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8010";
export function saveToken(token: string, email: string): void {
  localStorage.setItem("access", token);
  localStorage.setItem("email", email);
}
export function token(): string | null {
  return localStorage.getItem("access");
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const access = token();
  if (access) headers.set("Authorization", `Bearer ${access}`);
  const res = await fetch(`${API}${path}`, { ...init, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? data.code ?? "request failed");
  return data as T;
}
