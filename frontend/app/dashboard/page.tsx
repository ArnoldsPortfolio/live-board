"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { api } from "@/lib/api";
type Project = { id: string; title: string; description?: string; code?: string; status?: string };
const STAGES = [
  { id: "backlog", label: "Backlog" },
  { id: "in_progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
];
const EMPTY = { title: "", description: "", status: "backlog" };
export default function BoardsPage() {
  const [items, setItems] = useState<Project[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  async function load() {
    try { setItems(await api<Project[]>("/projects")); }
    catch { setItems(await api<Project[]>("/boards")); }
  }
  useEffect(() => { load().catch((err: Error) => setError(err.message)); }, []);
  async function create() {
    if (!form.title.trim()) return;
    const payload = { title: form.title.trim(), description: form.description.trim(), status: form.status };
    try {
      await api("/projects", { method: "POST", body: JSON.stringify(payload) });
    } catch {
      const board = await api<Project>("/boards", { method: "POST", body: JSON.stringify(payload) });
      if (form.status && form.status !== "backlog") {
        await api(`/projects/${board.id}`, { method: "PATCH", body: JSON.stringify({ status: form.status }) });
      }
    }
    setForm(EMPTY); setOpen(false); setError(""); await load();
  }
  async function move(id: string, status: string) {
    await api(`/projects/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    await load();
  }
  async function remove(id: string) {
    if (!window.confirm("Delete this project?")) return;
    try { await api(`/projects/${id}`, { method: "DELETE" }); }
    catch { await api(`/boards/${id}`, { method: "DELETE" }); }
    await load();
  }
  return (
    <AppShell title="Project Dashboard">
      <p className="toolbar"><button type="button" onClick={() => { setForm(EMPTY); setOpen(true); }}>+ New project</button></p>
      {error ? <p className="err">{error}</p> : null}
      {open ? (
        <form className="modal" style={{ margin: "0 0 1rem", position: "static", width: "min(420px, 100%)" }} onSubmit={(e) => { e.preventDefault(); create().catch((err: Error) => setError(err.message)); }}>
          <h2>New project</h2>
          <input required autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Name" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description of the work" />
          <label className="muted">Column</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {STAGES.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
          </select>
          <p className="toolbar"><button type="submit">Create</button><button type="button" onClick={() => setOpen(false)}>Cancel</button></p>
        </form>
      ) : null}
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
                  <p className="muted">{project.description || "No description"}</p>
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
    </AppShell>
  );
}
