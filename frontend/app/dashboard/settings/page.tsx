"use client";
import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { api } from "@/lib/api";
export default function SettingsPage() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("Live Board");
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [alerts, setAlerts] = useState(true);
  const [saved, setSaved] = useState("");
  useEffect(() => { api<{ name: string }>("/me").then((row) => setName(row.name)).catch(() => undefined); }, []);
  return (
    <AppShell title="Settings">
      <div className="grid-2">
        <article className="job-card"><p className="kicker">Company profile</p><p>Workspace name</p><input value={company} onChange={(e) => setCompany(e.target.value)} /><p>Timezone</p>
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)}><option>America/Los_Angeles</option><option>America/New_York</option><option>UTC</option></select></article>
        <article className="job-card"><p className="kicker">Your profile</p><p>Display name</p><input value={name} onChange={(e) => setName(e.target.value)} />
          <p><label><input type="checkbox" checked={alerts} onChange={(e) => setAlerts(e.target.checked)} /> Email digest</label></p>
          <button type="button" onClick={() => api("/me", { method: "PATCH", body: JSON.stringify({ name }) }).then(() => setSaved("Saved"))}>Save</button>{saved ? <p className="muted">{saved}</p> : null}</article>
      </div>
    </AppShell>
  );
}
