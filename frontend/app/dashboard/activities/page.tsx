"use client";
import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { api } from "@/lib/api";
type Board = { id: string; title: string };
type Card = { id: string; title: string; blocked?: boolean; column_id: string };
type Column = { id: string; title: string };
type Detail = { cards: Card[]; columns: Column[] };
export default function ActivitiesPage() {
  const [rows, setRows] = useState<string[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    api<Board[]>("/boards").then(async (boards) => {
      const lines: string[] = [];
      for (const board of boards) {
        const detail = await api<Detail>(`/boards/${board.id}`);
        for (const card of detail.cards) {
          const col = detail.columns.find((c) => c.id === card.column_id)?.title ?? "column";
          lines.push(`${board.title}: ${card.title} in ${col}${card.blocked ? " · blocked" : ""}`);
        }
      }
      setRows(lines);
    }).catch((err: Error) => setError(err.message));
  }, []);
  return (
    <AppShell title="Activities">
      {error ? <p className="err">{error}</p> : null}
      <div className="timeline">
        {rows.length === 0 ? <p className="muted">No card activity yet. Add cards on a board.</p> : null}
        {rows.map((line) => <article className="item" key={line}>{line}</article>)}
      </div>
    </AppShell>
  );
}
