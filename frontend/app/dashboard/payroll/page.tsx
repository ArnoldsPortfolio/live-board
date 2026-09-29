"use client";
import { useState } from "react";
import AppShell from "../../components/AppShell";
type Row = { period: string; status: string; amount: string; people: number };
export default function PayrollPage() {
  const [rows, setRows] = useState<Row[]>([
    { period: "1-15 Sep 2026", status: "Paid", amount: "$12,400", people: 4 },
    { period: "16-30 Sep 2026", status: "Review", amount: "$12,400", people: 4 },
    { period: "1-15 Oct 2026", status: "Draft", amount: "$12,400", people: 4 },
  ]);
  return (
    <AppShell title="Payroll">
      <div className="stats"><div className="stat">Gross $37,200</div><div className="stat">Next run Oct 15</div><div className="stat">{rows.filter((r) => r.status !== "Paid").length} open</div></div>
      <table className="table"><thead><tr><th>Period</th><th>People</th><th>Status</th><th>Amount</th><th></th></tr></thead><tbody>
        {rows.map((row) => (
          <tr key={row.period}><td>{row.period}</td><td>{row.people}</td><td><span className="chip">{row.status}</span></td><td>{row.amount}</td>
          <td>{row.status !== "Paid" ? <button type="button" onClick={() => setRows(rows.map((r) => r.period !== row.period ? r : { ...r, status: r.status === "Draft" ? "Review" : "Paid" }))}>{row.status === "Draft" ? "Send to review" : "Mark paid"}</button> : "—"}</td></tr>
        ))}
      </tbody></table>
    </AppShell>
  );
}
