"use client";
import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { api } from "@/lib/api";
type Person = { id: string; email: string; name: string; role: string };
export default function EmployeesPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { api<Person[]>("/team").then(setPeople).catch((err: Error) => setError(err.message)); }, []);
  const rows = people.filter((p) => `${p.name} ${p.email} ${p.role}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <AppShell title="Employee">
      <div className="stats">
        <div className="stat">{people.length} records</div>
        <div className="stat">{people.filter((p) => p.role === "manager").length} managers</div>
        <div className="stat">{people.filter((p) => p.role === "authorized").length} authorized</div>
      </div>
      <p className="toolbar"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search employee ..." /></p>
      {error ? <p className="err">{error}</p> : <p className="muted">Directory, department, and access level.</p>}
      <table className="table"><thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Access</th><th>Status</th></tr></thead>
      <tbody>{rows.map((person) => (<tr key={person.id}><td>{person.name || person.email.split("@")[0]}</td><td>{person.email}</td><td>{person.role === "manager" ? "Leadership" : "Delivery"}</td><td><span className="chip">{person.role}</span></td><td><span className="chip">Active</span></td></tr>))}</tbody></table>
    </AppShell>
  );
}
