"use client";
import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { api } from "@/lib/api";
type Me = { email: string; name: string; role: string };
export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState("");
  useEffect(() => { api<Me>("/me").then((row) => { setMe(row); setName(row.name); }); }, []);
  return (
    <AppShell title="Profile">
      <div className="grid-2">
        <article className="job-card"><p className="kicker">Self-service</p><p>{me?.email}</p><p><span className="chip">{me?.role}</span></p>
          <input value={name} onChange={(e) => setName(e.target.value)} />
          <button type="button" onClick={() => api("/me", { method: "PATCH", body: JSON.stringify({ name }) }).then(() => setSaved("Saved"))}>Update name</button>
          {saved ? <p className="muted">{saved}</p> : null}</article>
        <article className="job-card"><p className="kicker">Security</p><p className="muted">Sign out from the sidebar on a shared machine.</p></article>
      </div>
    </AppShell>
  );
}
