"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { api } from "@/lib/api";
type Project = { id: string; title: string; description?: string; code?: string; start_date?: string; end_date?: string; status?: string };
const STAGES = [
  { id: "backlog", label: "Backlog" },
  { id: "in_progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
];
const EMPTY = { title: "", description: "", code: "", start_date: "", end_date: "", budget: "", status: "backlog" };
export default function BoardsPage() {
  const [items, setItems] = useState<Project[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  async function load() { setItems(await api<Project[]>("/projects")); }
  useEffect(() => { load().catch((err: Error) => setError(err.message)); }, []);
  async function create() {
    if (!form.title.trim()) return;
    await api("/projects", { method: "POST", body: JSON.stringify(form) });
    setForm(EMPTY); setOpen(false); await load();
  }
  async function move(id: string, status: string) {
    await api(`/projects/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    await load();
  }
  async function remove(id: string) {
    if (!window.confirm("Delete this project?")) return;
    await api(`/projects/${id}`, { method: "DELETE" });
    await load();
  }
  return (
    <AppShell title="Project Dashboard">
      <p className="toolbar"><button type="button" onClick={() => { setForm(EMPTY); setOpen(true); }}>+ New project</button></p>
      {error ? <p className="err">{error}</p> : null}
      <div className="board">
        {STAGES.map((stage) => {
          const rows = items.filter((p) => (p.status || "backlog") === stage.id);
          return (
            <section className="col" key={stage.id}>
              <h3>{stage.label} <span className="muted">{rows.length}</span></h3>
              <button type="button" onClick={() => { setForm({ ...EMPTY, status: stage.id }); setOpen(true); }}>+</button>
              {rows.map((project) => (
                <article className="item" key={project.id}>
                  <span className="chip">{project.code || "Project"}</span>
                  <h3><Link href={`/dashboard/board/${project.id}`}>{project.title}</Link></h3>
                  <p className="muted">{project.description || "Open board"}</p>
                  <select value={project.status || "backlog"} onChange={(e) => move(project.id, e.target.value).catch((err: Error) => setError(err.message))}>
                    {STAGES.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                  </select>
                  <p className="toolbar">
                    <Link className="chip" href={`/dashboard/board/${project.id}`}>Open</Link>
                    <button type="button" onClick={() => remove(project.id).catch((err: Error) => setError(err.message))}>Delete</button>
                  </p>
                </article>
              ))}
            </section>
          );
        })}
      </div>
      {open ? (
        <div className="modal-back" onClick={() => setOpen(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); create().catch((err: Error) => setError(err.message)); }}>
            <h2>New project</h2>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Name" />
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Code" />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" />
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STAGES.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
            </select>
            <p className="toolbar"><button type="submit">Create</button><button type="button" onClick={() => setOpen(false)}>Cancel</button></p>
          </form>
        </div>
      ) : null}
    </AppShell>
  );
}
