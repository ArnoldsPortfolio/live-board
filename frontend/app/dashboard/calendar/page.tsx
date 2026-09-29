"use client";
import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/AppShell";
import { api } from "@/lib/api";

type Item = { id: string; title: string; due_date: string };
type Note = { id: string; day: string; text: string };
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const KEY = "live-board-cal-notes";
function loadNotes(): Note[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [items, setItems] = useState<Item[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");
  const [picked, setPicked] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { setNotes(loadNotes()); }, []);
  useEffect(() => {
    api<Item[]>(`/calendar?year=${year}&month=${month}`).then(setItems).catch((err: Error) => setError(err.message));
  }, [year, month]);
  const cells = useMemo(() => {
    const offset = (new Date(year, month - 1, 1).getDay() + 6) % 7;
    const days = new Date(year, month, 0).getDate();
    return Array.from({ length: 42 }, (_, i) => {
      const day = i - offset + 1;
      return day >= 1 && day <= days ? day : 0;
    });
  }, [year, month]);
  function stamp(day: number) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  function addNote() {
    if (!picked || !draft.trim()) return;
    const next = [...notes, { id: String(Date.now()), day: picked, text: draft.trim() }];
    setNotes(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    setDraft("");
  }
  const label = new Date(year, month - 1, 1).toLocaleString("en", { month: "long", year: "numeric" });
  return (
    <AppShell title="Calendar">
      <div className="cal-wrap">
        <p className="toolbar">
          <strong>{label}</strong>
          <button type="button" onClick={() => month === 1 ? (setMonth(12), setYear(year - 1)) : setMonth(month - 1)}>‹</button>
          <button type="button" onClick={() => month === 12 ? (setMonth(1), setYear(year + 1)) : setMonth(month + 1)}>›</button>
        </p>
        {error ? <p className="err">{error}</p> : <p className="muted">Click a day and write the task for that date.</p>}
        <div className="cal-grid">
          {WEEK.map((d) => <div className="cal-dow" key={d}>{d}</div>)}
          {cells.map((day, i) => {
            const key = day ? stamp(day) : "";
            const today = day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();
            return (
              <button type="button" className={`cal-cell${today ? " today" : ""}`} key={i} disabled={!day} onClick={() => setPicked(key)}>
                {day ? <span className="cal-num">{day}</span> : null}
                {items.filter((item) => item.due_date === key).map((item) => <span className="cal-pill" key={item.id}>{item.title}</span>)}
                {notes.filter((n) => n.day === key).map((n) => <span className="cal-pill note" key={n.id}>{n.text}</span>)}
              </button>
            );
          })}
        </div>
        {picked ? (
          <p className="toolbar">
            <span className="muted">{picked}</span>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Task note for this day" />
            <button type="button" onClick={addNote}>Add note</button>
          </p>
        ) : <p className="muted">Click a day to write a task note.</p>}
      </div>
    </AppShell>
  );
}
