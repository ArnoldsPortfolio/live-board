"use client";
import { useState } from "react";
import AppShell from "../../components/AppShell";
type Candidate = { id: string; name: string; role: string; stage: string };
const START: Candidate[] = [
  { id: "1", name: "Ava Chen", role: "Frontend engineer", stage: "Applied" },
  { id: "2", name: "Miles Park", role: "Product designer", stage: "Interview" },
  { id: "3", name: "Priya Shah", role: "Backend engineer", stage: "Offer" },
  { id: "4", name: "Jonah Lee", role: "Ops lead", stage: "Hired" },
];
const STAGES = ["Applied", "Interview", "Offer", "Hired"];
export default function JobsPage() {
  const [rows, setRows] = useState(START);
  const [name, setName] = useState("");
  const [role, setRole] = useState("Engineer");
  return (
    <AppShell title="Job Management">
      <div className="stats">{STAGES.map((stage) => <div className="stat" key={stage}>{stage} {rows.filter((r) => r.stage === stage).length}</div>)}</div>
      <p className="toolbar">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Candidate name" />
        <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Open role" />
        <button type="button" onClick={() => name && setRows([...rows, { id: String(Date.now()), name, role, stage: "Applied" }])}>Add applicant</button>
      </p>
      <div className="board">{STAGES.map((stage) => (
        <section className="col" key={stage}>
          <h3>{stage} ({rows.filter((r) => r.stage === stage).length})</h3>
          {rows.filter((r) => r.stage === stage).map((row) => (
            <article className="item" key={row.id}>
              <strong>{row.name}</strong>
              <p className="muted">{row.role}</p>
              <select value={row.stage} onChange={(e) => setRows(rows.map((r) => r.id === row.id ? { ...r, stage: e.target.value } : r))}>
                {STAGES.map((opt) => <option key={opt}>{opt}</option>)}
              </select>
            </article>
          ))}
        </section>
      ))}</div>
    </AppShell>
  );
}
