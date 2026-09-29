"use client";
import AppShell from "../../components/AppShell";
const ROWS = [
  { period: "1-15 Sep 2026", status: "Paid", amount: "$12,400" },
  { period: "16-30 Sep 2026", status: "Scheduled", amount: "$12,400" },
  { period: "1-15 Oct 2026", status: "Draft", amount: "$12,400" },
];
export default function PayrollPage() {
  return (
    <AppShell title="Payroll">
      <div className="stats"><div className="stat">Next run Oct 15</div><div className="stat">3 periods</div></div>
      <table className="table"><thead><tr><th>Period</th><th>Status</th><th>Amount</th></tr></thead><tbody>
        {ROWS.map((row) => (<tr key={row.period}><td>{row.period}</td><td><span className="chip">{row.status}</span></td><td>{row.amount}</td></tr>))}
      </tbody></table>
    </AppShell>
  );
}
