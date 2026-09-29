"use client";
import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { api } from "@/lib/api";
type Item = { id: string; title: string; due_date: string };
export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [items, setItems] = useState<Item[]>([]);
  const [leave, setLeave] = useState<{ day: number; label: string }[]>([{ day: 4, label: "PTO" }]);
  const [error, setError] = useState("");
  useEffect(() => { api<Item[]>(`/calendar?year=${year}&month=${month}`).then(setItems).catch((err: Error) => setError(err.message)); }, [year, month]);
  const first = new Date(year, month - 1, 1).getDay();
  const days = new Date(year, month, 0).getDate();
  return (
    <AppShell title="Calendar">
      <p className="toolbar">
        <button type="button" onClick={() => month === 1 ? (setMonth(12), setYear(year - 1)) : setMonth(month - 1)}>Prev</button>
        <button type="button" onClick={() => month === 12 ? (setMonth(1), setYear(year + 1)) : setMonth(month + 1)}>Next</button>
        <button type="button" onClick={() => setLeave([...leave, { day: now.getDate(), label: "Leave request" }])}>Request leave</button>
      </p>
      {error ? <p className="err">{error}</p> : <p className="muted">Due dates from cards plus leave marks.</p>}
      <div className="board">{Array.from({ length: first + days }).map((_, i) => {
        const day = i - first + 1;
        const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return (<section className="col" key={i}><h3>{day > 0 ? day : ""}</h3>
          {items.filter((item) => item.due_date === key).map((item) => <article className="item" key={item.id}>{item.title}</article>)}
          {leave.filter((row) => row.day === day).map((row) => <article className="item" key={row.label + day}><span className="chip">{row.label}</span></article>)}
        </section>);
      })}</div>
    </AppShell>
  );
}
