"use client";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AppShell from "../../../components/AppShell";
import { API, api, token } from "@/lib/api";

type Check = { id: string; title: string; is_done: boolean };
type Column = { id: string; title: string; position: number; policy?: string; wip_limit?: number | null };
type Card = { id: string; title: string; column_id: string; position: number; description?: string; due_date?: string; priority?: string; blocked?: boolean; checklist?: Check[] };
type Board = { id: string; title: string; sequence: number; columns: Column[]; cards: Card[] };
type Op = { sequence: number; kind: string; payload: string | Record<string, string> };
function parsePayload(raw: string | Record<string, string>): Record<string, string> {
  if (typeof raw === "string") return JSON.parse(raw);
  return raw;
}
function uniqueCards(cards: Card[]) {
  return cards.filter((card, i, all) => all.findIndex((row) => row.id === card.id) === i);
}
export default function BoardPage() {
  const params = useParams<{ id: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const [title, setTitle] = useState("New card");
  const [invite, setInvite] = useState("");
  const [share, setShare] = useState("");
  const [viewers, setViewers] = useState<string[]>([]);
  const [open, setOpen] = useState<Card | null>(null);
  const [comment, setComment] = useState("");
  const [checkTitle, setCheckTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const seq = useRef(0);
  function applyOp(current: Board, op: Op): Board {
    const payload = parsePayload(op.payload);
    const next = { ...current, sequence: op.sequence, cards: [...current.cards], columns: [...current.columns] };
    if (op.kind === "card.added" && !next.cards.some((c) => c.id === payload.id)) {
      next.cards.push({ id: payload.id, title: payload.title, column_id: payload.column_id, position: 0 });
    }
    if (op.kind === "card.moved") next.cards = next.cards.map((c) => c.id === payload.id ? { ...c, column_id: payload.column_id } : c);
    if (op.kind === "card.renamed" || op.kind === "card.undone") next.cards = next.cards.map((c) => c.id === payload.id ? { ...c, title: payload.title ?? c.title, column_id: payload.column_id ?? c.column_id } : c);
    if (op.kind === "column.added" && !next.columns.some((c) => c.id === payload.id)) {
      next.columns.push({ id: payload.id, title: payload.title, position: Number(payload.position ?? next.columns.length) });
    }
    next.cards = uniqueCards(next.cards);
    return next;
  }
  async function load() {
    const detail = await api<Board>(`/boards/${params.id}`);
    detail.cards = uniqueCards(detail.cards);
    seq.current = detail.sequence;
    setBoard(detail);
  }
  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
    if (!token()) return;
    let ws: WebSocket;
    function connect() {
      ws = new WebSocket(`${API.replace("http", "ws")}/ws/boards/${params.id}?token=${token()}`);
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.kind === "presence") { setViewers((msg.viewers ?? []).map((v: { email: string }) => v.email)); return; }
        setBoard((current) => current ? applyOp(current, msg) : current);
        if (msg.sequence) seq.current = msg.sequence;
      };
      ws.onclose = () => setTimeout(connect, 1500);
    }
    connect();
    return () => { ws?.close(); };
  }, [params.id]);
  if (!board) return <p className="muted" style={{ padding: "2rem" }}>{error || "Loading…"}</p>;
  return (
    <AppShell title={board.title}>
      <p className="toolbar">
        {viewers.map((email) => <span className="dot" key={email}>{email.slice(0, 1).toUpperCase()}</span>)}
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New card" />
        <input value={invite} onChange={(e) => setInvite(e.target.value)} placeholder="Invite email" />
        <button type="button" onClick={() => api(`/boards/${board.id}/invites`, { method: "POST", body: JSON.stringify({ email: invite }) }).catch((err: Error) => setError(err.message))}>Invite</button>
        <button type="button" onClick={() => api<{ token: string }>(`/boards/${board.id}/share-link`, { method: "POST" }).then((r) => setShare(r.token)).catch((err: Error) => setError(err.message))}>Share</button>
        {share ? <span className="muted">{share}</span> : null}
      </p>
      {error ? <p className="err">{error}</p> : null}
      <div className="board">
        {board.columns.map((column) => {
          const cards = uniqueCards(board.cards).filter((c) => c.column_id === column.id);
          return (
            <section className="col" key={column.id}>
              <h3>{column.title} <span className="muted">{cards.length}{column.wip_limit ? `/${column.wip_limit}` : ""}</span></h3>
              <button type="button" onClick={() => api(`/boards/${board.id}/cards`, { method: "POST", body: JSON.stringify({ column_id: column.id, title }) }).then(load).catch((err: Error) => setError(err.message))}>+</button>
              {cards.map((card) => (
                <article className={card.blocked ? "item blocked" : "item"} key={card.id} onClick={() => setOpen(card)}>
                  <p><span className={`chip ${card.priority || "med"}`}>{card.priority || "med"} priority</span></p>
                  <strong>{card.title}</strong>
                  <p className="muted">{card.description || "No description yet"}</p>
                  <p className="muted">{card.due_date || "No date"}</p>
                  {card.blocked ? <span className="chip bad">Blocked</span> : null}
                </article>
              ))}
            </section>
          );
        })}
      </div>
      {open ? (
        <aside className="drawer">
          <h2>{open.title}</h2>
          <textarea defaultValue={open.description} onBlur={(e) => api(`/boards/${board.id}/cards/${open.id}`, { method: "PATCH", body: JSON.stringify({ description: e.target.value }) }).then(load)} />
          <input type="date" defaultValue={open.due_date} onBlur={(e) => api(`/boards/${board.id}/cards/${open.id}`, { method: "PATCH", body: JSON.stringify({ due_date: e.target.value }) }).then(load)} />
          <select defaultValue={open.priority ?? "med"} onChange={(e) => api(`/boards/${board.id}/cards/${open.id}`, { method: "PATCH", body: JSON.stringify({ priority: e.target.value }) }).then(load)}>
            <option value="low">low</option><option value="med">med</option><option value="high">high</option><option value="urgent">urgent</option>
          </select>
          <select value={open.column_id} onChange={(e) => api(`/boards/${board.id}/cards/${open.id}/move`, { method: "POST", body: JSON.stringify({ column_id: e.target.value }) }).then(load).catch((err: Error) => setError(err.message))}>
            {board.columns.map((opt) => <option key={opt.id} value={opt.id}>{opt.title}</option>)}
          </select>
          <input value={checkTitle} onChange={(e) => setCheckTitle(e.target.value)} placeholder="Checklist item" />
          <button type="button" onClick={() => api(`/boards/${board.id}/cards/${open.id}/checklist`, { method: "POST", body: JSON.stringify({ title: checkTitle }) }).then(load)}>Add check</button>
          <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comment" />
          <button type="button" onClick={() => api(`/boards/${board.id}/cards/${open.id}/comments`, { method: "POST", body: JSON.stringify({ body: comment }) }).then(() => setNotes("Comment saved"))}>Save comment</button>
          {notes ? <p className="muted">{notes}</p> : null}
          <p><button type="button" onClick={() => setOpen(null)}>Close</button></p>
        </aside>
      ) : null}
    </AppShell>
  );
}
