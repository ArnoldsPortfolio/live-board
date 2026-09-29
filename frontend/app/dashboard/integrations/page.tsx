"use client";
import AppShell from "../../components/AppShell";
const TOOLS = [
  { name: "Slack", detail: "Turn a channel message into a Backlog card." },
  { name: "Email", detail: "Forward a thread to create a work item." },
  { name: "GitHub", detail: "Link a pull request on a card." },
];
export default function IntegrationsPage() {
  return (
    <AppShell title="Integration">
      <div className="grid-2">
        {TOOLS.map((tool) => (
          <article className="job-card" key={tool.name}>
            <h3>{tool.name}</h3>
            <p className="muted">{tool.detail}</p>
            <button type="button">Connect</button>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
