"use client";
import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { api } from "@/lib/api";
type Board = { id: string; title: string };
export default function JobsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  useEffect(() => { api<Board[]>("/boards").then(setBoards).catch(() => undefined); }, []);
  return (
    <AppShell title="Job Management">
      <p className="muted">Open roles tracked as workspace projects.</p>
      <div className="grid-2">
        {boards.map((board) => (
          <article className="job-card" key={board.id}>
            <span className="chip">Open</span>
            <h3>{board.title}</h3>
            <p className="muted">Kanban board linked as a workstream.</p>
            <a className="chip" href={`/dashboard/board/${board.id}`}>Open board</a>
          </article>
        ))}
        {boards.length === 0 ? <article className="job-card">Create a board to list a job stream.</article> : null}
      </div>
    </AppShell>
  );
}
