"use client";
import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { api } from "@/lib/api";
type Board = { id: string; title: string };
type Card = { title: string; blocked?: boolean; column_id: string };
type Column = { id: string; title: string };
type Detail = { cards: Card[]; columns: Column[] };
export default function ActivitiesPage() {
  const [rows, setRows] = useState<string[]>([]);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  useEffect(() => {
    api<Board[]>("/boards").then(async (boards) => {
      const lines: string[] = [];
      for (const board of boards) {
        const detail = await api<Detail>(`/boards/${board.id}`);
        for (const card of detail.cards) {
          const col = detail.columns.find((c) => c.id === card.column_id)?.title ?? "column";
          lines.push(`${card.blocked ? "blocked" : "moved"}|${board.title} · ${card.title} in ${col}`);
        }
      }
      setRows(lines);
    }).catch((err: Error) => setError(err.message));
  }, []);
  const shown = rows.filter((line) => filter === "all" || line.startsWith(filter));
  return (
    <AppShell title="Activities">
      <p className="toolbar"><button type="button" onClick={() => setFilter("all")}>All</button><button type="button" onClick={() => setFilter("moved")}>Moves</button><button type="button" onClick={() => setFilter("blocked")}>Blocked</button></p>
      {error ? <p className="err">{error}</p> : null}
      <div className="timeline">{shown.map((line) => <article className="item" key={line}>{line.split("|")[1]}</article>)}{shown.length === 0 ? <p className="muted">No matching activity.</p> : null}</div>
    </AppShell>
  );
}
