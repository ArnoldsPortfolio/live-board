"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api, saveToken } from "@/lib/api";
type Tokens = { access_token: string };
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("owner@board.dev");
  const [password, setPassword] = useState("ChangeMe123!");
  const [error, setError] = useState("");
  async function submit(path: "/auth/sign-in" | "/auth/sign-up", event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const tokens = await api<Tokens>(path, { method: "POST", body: JSON.stringify({ email, password }) });
      saveToken(tokens.access_token, email);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }
  return (
    <div className="auth">
      <form className="card" onSubmit={(e) => submit("/auth/sign-in", e)}>
        <p className="muted">Live Board</p>
        <h1>Sign in</h1>
        <p><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required /></p>
        <p><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required /></p>
        {error ? <p className="err">{error}</p> : null}
        <button type="submit">Sign in</button>
        {" "}
        <button type="button" onClick={(e) => submit("/auth/sign-up", e)}>Create account</button>
      </form>
    </div>
  );
}
