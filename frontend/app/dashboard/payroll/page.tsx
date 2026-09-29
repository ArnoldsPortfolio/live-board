"use client";
import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { api } from "@/lib/api";
type Row = { id: string; period: string; status: string; amount: string; people: number };
export default function PayrollPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  async function load() { setRows(await api<Row[]>("/payroll/periods")); }
  useEffect(() => { load().catch((err: Error) => setError(err.message)); }, []);
  async function advance(id: string) {
    await api(`/payroll/periods/${id}/advance`, { method: "POST" });
    await load();
  }
  return (
    <AppShell title="Payroll">
      <div className="stats">
        <div className="stat">{rows.length} periods</div>
        <div className="stat">{rows.filter((r) => r.status !== "Paid").length} open</div>
      </div>
      {error ? <p className="err">{error}</p> : null}
      <table className="table">
        <thead><tr><th>Period</th><th>People</th><th>Status</th><th>Amount</th><th></th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.period}</td><td>{row.people}</td>
              <td><span className="chip">{row.status}</span></td><td>{row.amount}</td>
              <td>{row.status !== "Paid" ? <button type="button" onClick={() => advance(row.id).catch((err: Error) => setError(err.message))}>{row.status === "Draft" ? "Send to review" : "Mark paid"}</button> : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </AppShell>
  );
}
