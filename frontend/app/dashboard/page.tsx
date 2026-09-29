"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { api } from "@/lib/api";
type Board = { id: string; title: string; description?: string; code?: string; start_date?: string; end_date?: string; budget?: string };
type Detail = { cards: Array<{ blocked?: boolean; due_date?: string; assignee_id?: string }> };
const EMPTY = { title: "", description: "", code: "", start_date: "", end_date: "", budget: "" };
export default function BoardsPage() {
  const [items, setItems] = useState<Board[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [share, setShare] = useState("");
  const [error, setError] = useState("");
  const [stats, setStats] = useState({ boards: 0, blocked: 0, overdue: 0, unassigned: 0 });
  async function load() {
    const boards = await api<Board[]>("/boards");
    setItems(boards);
    let blocked = 0, overdue = 0, unassigned = 0;
    const today = new Date().toISOString().slice(0, 10);
    for (const board of boards) {
      const detail = await api<Detail>(`/boards/${board.id}`);
      blocked += detail.cards.filter((c) => c.blocked).length;
      overdue += detail.cards.filter((c) => c.due_date && c.due_date < today).length;
      unassigned += detail.cards.filter((c) => !c.assignee_id).length;
    }
    setStats({ boards: boards.length, blocked, overdue, unassigned });
  }
  useEffect(() => { load().catch((err: Error) => setError(err.message)); }, []);
  async function create() {
    if (!form.title.trim()) return;
    await api("/boards/projects", { method: "POST", body: JSON.stringify(form) });
    setForm(EMPTY); setOpen(false); await load();
  }
  async function remove(id: string) {
    if (!window.confirm("Delete this project?")) return;
    await api(`/boards/${id}`, { method: "DELETE" });
    await load();
  }
  const visible = items.filter((b) => b.title.toLowerCase().includes(query.toLowerCase()));
  return (
    <AppShell title="Dashboard">
      <div className="stats">
        <div className="stat">Projects {stats.boards}</div>
        <div className="stat">Blocked {stats.blocked}</div>
        <div className="stat">Overdue {stats.overdue}</div>
        <div className="stat">Unassigned {stats.unassigned}</div>
      </div>
      <p className="toolbar">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search project ..." />
        <button type="button" onClick={() => setOpen(true)}>New project</button>
        <input value={share} onChange={(e) => setShare(e.target.value)} placeholder="Share token" />
        <button type="button" onClick={() => api("/boards/join", { method: "POST", body: JSON.stringify({ token: share }) }).then(load)}>Join</button>
      </p>
      {error ? <p className="err">{error}</p> : null}
      <div className="grid-2">
        {visible.map((board) => (
          <article className="job-card" key={board.id}>
            <span className="chip">{board.code || "Project"}</span>
            <h3><Link href={`/dashboard/board/${board.id}`}>{board.title}</Link></h3>
            <p className="muted">{board.description || "Open board"}</p>
            <p className="muted">{board.start_date || "-"} to {board.end_date || "-"} {board.budget ? ` / ${board.budget}` : ""}</p>
            <p className="toolbar">
              <Link className="chip" href={`/dashboard/board/${board.id}`}>Open</Link>
              <button type="button" onClick={() => remove(board.id).catch((err: Error) => setError(err.message))}>Delete</button>
            </p>
          </article>
        ))}
      </div>
      {open ? (
        <div className="modal-back" onClick={() => setOpen(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); create().catch((err: Error) => setError(err.message)); }}>
            <h2>New project</h2>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Name" />
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Code (optional)" />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" />
            <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            <input value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="Budget" />
            <p className="toolbar"><button type="submit">Create</button><button type="button" onClick={() => setOpen(false)}>Cancel</button></p>
          </form>
        </div>
      ) : null}
    </AppShell>
  );
}
