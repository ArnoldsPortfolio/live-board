"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { API, api, token } from "@/lib/api";
type Column = { id: string; title: string; position: number };
type Card = { id: string; title: string; column_id: string; position: number };
type Board = { id: string; title: string; sequence: number; columns: Column[]; cards: Card[] };
export default function BoardPage() {
  const params = useParams<{ id: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const [title, setTitle] = useState("New card");
  const [viewers, setViewers] = useState<string[]>([]);
  const [error, setError] = useState("");
  async function load() { setBoard(await api<Board>(`/boards/${params.id}`)); }
  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
    const access = token();
    if (!access) return;
    const ws = new WebSocket(`${API.replace("http", "ws")}/ws/boards/${params.id}?token=${access}`);
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.kind === "presence") setViewers((msg.viewers ?? []).map((v: { email: string }) => v.email));
      else load().catch(() => undefined);
    };
    return () => ws.close();
  }, [params.id]);
  async function addCard(columnId: string) {
    await api(`/boards/${params.id}/cards`, { method: "POST", body: JSON.stringify({ column_id: columnId, title }) });
    await load();
  }
  async function move(cardId: string, columnId: string) {
    await api(`/boards/${params.id}/cards/${cardId}/move`, { method: "POST", body: JSON.stringify({ column_id: columnId }) });
    await load();
  }
  if (!board) return <p className="muted" style={{ padding: "2rem" }}>{error || "Loading…"}</p>;
  return (
    <div className="shell">
      <aside>
        <Link href="/dashboard">Boards</Link>
        <h2>{board.title}</h2>
        <p className="muted">Viewing</p>
        {viewers.map((email) => <p key={email}>{email}</p>)}
      </aside>
      <main>
        <p><input value={title} onChange={(e) => setTitle(e.target.value)} /></p>
        {error ? <p className="err">{error}</p> : null}
        <div className="board">
          {board.columns.map((column) => (
            <section className="col" key={column.id}>
              <h3>{column.title}</h3>
              <button type="button" onClick={() => addCard(column.id).catch((err: Error) => setError(err.message))}>Add card</button>
              {board.cards.filter((card) => card.column_id === column.id).map((card) => (
                <article className="item" key={card.id}>
                  <div>{card.title}</div>
                  <select value={card.column_id} onChange={(e) => move(card.id, e.target.value).catch((err: Error) => setError(err.message))}>
                    {board.columns.map((opt) => <option key={opt.id} value={opt.id}>{opt.title}</option>)}
                  </select>
                </article>
              ))}
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
