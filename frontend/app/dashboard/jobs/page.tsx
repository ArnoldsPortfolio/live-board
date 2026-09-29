"use client";
import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { api } from "@/lib/api";
type Candidate = { id: string; name: string; role: string; stage: string };
const STAGES = ["Applied", "Interview", "Offer", "Hired"];
export default function JobsPage() {
  const [rows, setRows] = useState<Candidate[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("Engineer");
  const [error, setError] = useState("");
  async function load() { setRows(await api<Candidate[]>("/jobs/candidates")); }
  useEffect(() => { load().catch((err: Error) => setError(err.message)); }, []);
  async function add() {
    if (!name.trim()) return;
    await api("/jobs/candidates", { method: "POST", body: JSON.stringify({ name, role, stage: "Applied" }) });
    setName(""); await load();
  }
  async function move(id: string, stage: string) {
    await api(`/jobs/candidates/${id}`, { method: "PATCH", body: JSON.stringify({ stage }) });
    await load();
  }
  return (
    <AppShell title="Job Management">
      <div className="stats">{STAGES.map((stage) => <div className="stat" key={stage}>{stage} {rows.filter((r) => r.stage === stage).length}</div>)}</div>
      {error ? <p className="err">{error}</p> : null}
      <p className="toolbar">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Candidate name" />
        <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Open role" />
        <button type="button" onClick={() => add().catch((err: Error) => setError(err.message))}>Add applicant</button>
      </p>
      <div className="board">
        {STAGES.map((stage) => (
          <section className="col" key={stage}>
            <h3>{stage} ({rows.filter((r) => r.stage === stage).length})</h3>
            {rows.filter((r) => r.stage === stage).map((row) => (
              <article className="item" key={row.id}>
                <strong>{row.name}</strong>
                <p className="muted">{row.role}</p>
                <select value={row.stage} onChange={(e) => move(row.id, e.target.value).catch((err: Error) => setError(err.message))}>
                  {STAGES.map((opt) => <option key={opt}>{opt}</option>)}
                </select>
              </article>
            ))}
          </section>
        ))}
      </div>
    </AppShell>
  );
}
