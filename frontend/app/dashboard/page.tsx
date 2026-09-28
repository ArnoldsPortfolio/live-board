"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
type Board = { id: string; title: string; sequence: number };
export default function BoardsPage() {
  const [items, setItems] = useState<Board[]>([]);
  const [title, setTitle] = useState("New board");
  const [error, setError] = useState("");
  async function load() { setItems(await api<Board[]>("/boards")); }
  useEffect(() => { load().catch((err: Error) => setError(err.message)); }, []);
  async function create() {
    await api("/boards", { method: "POST", body: JSON.stringify({ title }) });
    await load();
  }
  return (
    <div className="shell">
      <aside><strong>Live Board</strong><p className="muted">Boards</p></aside>
      <main>
        <h1>Boards</h1>
        <p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
          <button type="button" onClick={() => create().catch((err: Error) => setError(err.message))}>Create</button>
        </p>
        {error ? <p className="err">{error}</p> : null}
        {items.map((board) => (
          <p key={board.id}><Link href={`/dashboard/board/${board.id}`}>{board.title}</Link></p>
        ))}
      </main>
    </div>
  );
}
