"use client";
import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { api } from "@/lib/api";
export default function SettingsPage() {
  const [name, setName] = useState("");
  const [saved, setSaved] = useState("");
  useEffect(() => { api<{ name: string }>("/me").then((row) => setName(row.name)).catch(() => undefined); }, []);
  return (
    <AppShell title="Settings">
      <div className="job-card">
        <p className="kicker">Workspace</p>
        <p>Display name</p>
        <input value={name} onChange={(e) => setName(e.target.value)} />
        <button type="button" onClick={() => api("/me", { method: "PATCH", body: JSON.stringify({ name }) }).then(() => setSaved("Saved"))}>Save</button>
        {saved ? <p className="muted">{saved}</p> : null}
      </div>
    </AppShell>
  );
}
