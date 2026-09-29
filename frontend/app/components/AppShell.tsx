"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { signOut } from "@/lib/api";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/calendar", label: "Calendar" },
  { href: "/dashboard/employees", label: "Employee" },
  { href: "/dashboard", label: "Project" },
  { href: "/dashboard/activities", label: "Activities" },
  { href: "/dashboard/jobs", label: "Job Management" },
  { href: "/dashboard/payroll", label: "Payroll" },
  { href: "/dashboard/team", label: "Team" },
  { href: "/dashboard/settings", label: "Settings" },
  { href: "/dashboard/integrations", label: "Integration" },
  { href: "/dashboard/profile", label: "Profile" },
];

export default function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const email = typeof window === "undefined" ? "" : localStorage.getItem("email") ?? "";
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);
  return (
    <div className="sage">
      <aside className="sage-nav">
        <p className="sage-logo">Live Board</p>
        <nav>
          {NAV.map((item) => (
            <Link key={item.href + item.label} className={path === item.href ? "on" : ""} href={item.href}>{item.label}</Link>
          ))}
        </nav>
        <div className="sage-theme">
          <button type="button" className={!dark ? "on" : ""} onClick={() => setDark(false)}>Light</button>
          <button type="button" className={dark ? "on" : ""} onClick={() => setDark(true)}>Dark</button>
        </div>
        <button className="ghost" type="button" onClick={() => signOut().then(() => router.push("/login"))}>Sign out</button>
      </aside>
      <section className="sage-main">
        <header className="sage-top">
          <input placeholder="Search anything ..." />
          <div className="sage-user">
            <span className="dot">{(email || "U").slice(0, 1).toUpperCase()}</span>
            <span>{email || "Account"}</span>
          </div>
        </header>
        <div className="sage-head">
          <div>
            <h1>{title}</h1>
            <p className="muted">Last update {new Date().toLocaleDateString()}</p>
          </div>
        </div>
        {children}
      </section>
    </div>
  );
}
