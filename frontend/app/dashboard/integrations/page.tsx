"use client";
import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { api } from "@/lib/api";
type Tool = { id: string; name: string; detail: string; on: boolean };
export default function IntegrationsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [error, setError] = useState("");
  async function load() { setTools(await api<Tool[]>("/integrations")); }
  useEffect(() => { load().catch((err: Error) => setError(err.message)); }, []);
  async function toggle(id: string) {
    await api(`/integrations/${id}/toggle`, { method: "POST" });
    await load();
  }
  return (
    <AppShell title="Integration">
      {error ? <p className="err">{error}</p> : null}
      <div className="grid-2">
        {tools.map((tool) => (
          <article className="job-card" key={tool.id}>
            <h3>{tool.name}</h3>
            <p className="muted">{tool.detail}</p>
            <span className="chip">{tool.on ? "Connected" : "Off"}</span>
            <p><button type="button" onClick={() => toggle(tool.id).catch((err: Error) => setError(err.message))}>{tool.on ? "Disconnect" : "Connect"}</button></p>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
