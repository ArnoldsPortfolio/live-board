"use client";
import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { api } from "@/lib/api";
type Person = { id: string; email: string; name: string; role: string };
export default function EmployeesPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { api<Person[]>("/team").then(setPeople).catch((err: Error) => setError(err.message)); }, []);
  return (
    <AppShell title="Employee">
      <div className="stats"><div className="stat">{people.length} people</div><div className="stat">{people.filter((p) => p.role === "manager").length} managers</div></div>
      {error ? <p className="err">{error}</p> : <p className="muted">Directory from your workspace roster.</p>}
      <table className="table"><thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead><tbody>
        {people.map((person) => (<tr key={person.id}><td>{person.name || person.email.split("@")[0]}</td><td>{person.email}</td><td><span className="chip">{person.role}</span></td></tr>))}
      </tbody></table>
    </AppShell>
  );
}
