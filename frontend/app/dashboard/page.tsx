"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { api } from "@/lib/api";

type Board = { id: string; title: string; sequence: number };
type Detail = { cards: Array<{ blocked?: boolean; due_date?: string; assignee_id?: string }> };

export default function BoardsPage() {
  const [items, setItems] = useState<Board[]>([]);
  const [title, setTitle] = useState("New board");
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
  return (
    <AppShell title="Project">
      <div className="stats">
        <div className="stat">Project {stats.boards}</div>
        <div className="stat">Blocked {stats.blocked}</div>
        <div className="stat">Overdue {stats.overdue}</div>
        <div className="stat">Unassigned {stats.unassigned}</div>
      </div>
      <p className="toolbar">
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
        <button type="button" onClick={() => api("/boards", { method: "POST", body: JSON.stringify({ title }) }).then(load).catch((err: Error) => setError(err.message))}>Create</button>
        <input value={share} onChange={(e) => setShare(e.target.value)} placeholder="Share token" />
        <button type="button" onClick={() => api("/boards/join", { method: "POST", body: JSON.stringify({ token: share }) }).then(load).catch((err: Error) => setError(err.message))}>Join</button>
      </p>
      {error ? <p className="err">{error}</p> : null}
      {items.map((board) => (
        <Link className="board-link" key={board.id} href={`/dashboard/board/${board.id}`}>{board.title}</Link>
      ))}
    </AppShell>
  );
}
