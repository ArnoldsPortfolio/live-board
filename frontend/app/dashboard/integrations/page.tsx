"use client";
import { useState } from "react";
import AppShell from "../../components/AppShell";
const START = [
  { name: "Slack", detail: "Post board moves to a channel.", on: false },
  { name: "Email ingest", detail: "Turn a forwarded thread into a card.", on: false },
  { name: "Google Calendar", detail: "Show due dates on the shared calendar.", on: true },
  { name: "GitHub", detail: "Attach a pull request to a card.", on: false },
  { name: "SSO", detail: "Sign in with the company identity provider.", on: false },
];
export default function IntegrationsPage() {
  const [tools, setTools] = useState(START);
  return (
    <AppShell title="Integration">
      <p className="muted">Connect tools HR and delivery teams pair with a workspace.</p>
      <div className="grid-2">{tools.map((tool) => (
        <article className="job-card" key={tool.name}><h3>{tool.name}</h3><p className="muted">{tool.detail}</p>
          <span className="chip">{tool.on ? "Connected" : "Off"}</span>
          <p><button type="button" onClick={() => setTools(tools.map((row) => row.name === tool.name ? { ...row, on: !row.on } : row))}>{tool.on ? "Disconnect" : "Connect"}</button></p>
        </article>
      ))}</div>
    </AppShell>
  );
}
