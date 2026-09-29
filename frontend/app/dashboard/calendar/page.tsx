"use client";
import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/AppShell";
import { api } from "@/lib/api";

type Item = { id: string; title: string; due_date: string; description?: string };
type Note = { id: string; day: string; text: string; detail: string };
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
  const [picked, setPicked] = useState("");
  const [active, setActive] = useState<{ kind: "card" | "note"; id: string } | null>(null);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [error, setError] = useState("");
  async function refresh() {
    setItems(await api<Item[]>(`/calendar?year=${year}&month=${month}`));
  }
  useEffect(() => { setNotes(loadNotes()); }, []);
  useEffect(() => { refresh().catch((err: Error) => setError(err.message)); }, [year, month]);
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
  function saveNotes(next: Note[]) {
    setNotes(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }
  function openDay(key: string) {
    setPicked(key); setActive(null); setTitle(""); setDetail("");
  }
  async function saveActive() {
    if (!active) return;
    if (active.kind === "note") {
      saveNotes(notes.map((n) => n.id === active.id ? { ...n, text: title, detail } : n));
      setActive(null); return;
    }
    await api(`/calendar/${active.id}`, { method: "PATCH", body: JSON.stringify({ title, description: detail }) });
    await refresh(); setActive(null);
  }
  async function deleteActive() {
    if (!active) return;
    if (active.kind === "note") {
      saveNotes(notes.filter((n) => n.id !== active.id)); setActive(null); return;
    }
    await api(`/calendar/${active.id}`, { method: "DELETE" });
    await refresh(); setActive(null);
  }
  const label = new Date(year, month - 1, 1).toLocaleString("en", { month: "long", year: "numeric" });
  const dayCards = items.filter((item) => item.due_date === picked);
  const dayNotes = notes.filter((n) => n.day === picked);
  return (
    <AppShell title="Calendar">
      <div className="cal-wrap">
        <p className="toolbar">
          <strong>{label}</strong>
          <button type="button" onClick={() => month === 1 ? (setMonth(12), setYear(year - 1)) : setMonth(month - 1)}>‹</button>
          <button type="button" onClick={() => month === 12 ? (setMonth(1), setYear(year + 1)) : setMonth(month + 1)}>›</button>
        </p>
        {error ? <p className="err">{error}</p> : <p className="muted">Click a day to open its schedule.</p>}
        <div className="cal-grid">
          {WEEK.map((d) => <div className="cal-dow" key={d}>{d}</div>)}
          {cells.map((day, i) => {
            const key = day ? stamp(day) : "";
            const today = day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();
            return (
              <button type="button" className={`cal-cell${today ? " today" : ""}`} key={i} disabled={!day} onClick={() => openDay(key)}>
                {day ? <span className="cal-num">{day}</span> : null}
                {items.filter((item) => item.due_date === key).map((item) => <span className="cal-pill" key={item.id}>{item.title}</span>)}
                {notes.filter((n) => n.day === key).map((n) => <span className="cal-pill note" key={n.id}>{n.text}</span>)}
              </button>
            );
          })}
        </div>
      </div>
      {picked ? (
        <div className="modal-back" onClick={() => { setPicked(""); setActive(null); }}>
          <div className="modal day-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{picked}</h2>
            <p className="muted">{dayCards.length + dayNotes.length} events</p>
            {dayCards.map((item) => (
              <button type="button" className="job-card" key={item.id} onClick={() => { setActive({ kind: "card", id: item.id }); setTitle(item.title); setDetail(item.description || ""); }}>
                <span className="chip">Board card</span><strong> {item.title}</strong>
                <p className="muted">{item.description || "No details"}</p>
              </button>
            ))}
            {dayNotes.map((note) => (
              <button type="button" className="job-card" key={note.id} onClick={() => { setActive({ kind: "note", id: note.id }); setTitle(note.text); setDetail(note.detail); }}>
                <span className="chip">Note</span><strong> {note.text}</strong>
                <p className="muted">{note.detail || "No details"}</p>
              </button>
            ))}
            {active ? (
              <div className="job-card">
                <p className="kicker">Edit event</p>
                <input value={title} onChange={(e) => setTitle(e.target.value)} />
                <textarea value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Details" />
                <p className="toolbar">
                  <button type="button" onClick={() => saveActive().catch((err: Error) => setError(err.message))}>Save</button>
                  <button type="button" onClick={() => deleteActive().catch((err: Error) => setError(err.message))}>Delete</button>
                  <button type="button" onClick={() => setActive(null)}>Back</button>
                </p>
              </div>
            ) : (
              <div className="job-card">
                <p className="kicker">New event</p>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
                <textarea value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="What needs to be done" />
                <button type="button" onClick={() => picked && title.trim() && saveNotes([...notes, { id: String(Date.now()), day: picked, text: title.trim(), detail }]) || setTitle("")}>Add to this day</button>
              </div>
            )}
            <button type="button" onClick={() => { setPicked(""); setActive(null); }}>Close day</button>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
