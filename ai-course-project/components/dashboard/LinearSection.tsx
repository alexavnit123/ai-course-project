"use client";

import { useEffect, useMemo, useState } from "react";
import { LinearIssue, LinearApiResponse, STATE_TYPE_ORDER } from "@/lib/linear";
import { dateStringToTimestamp, formatDueDate } from "@/lib/utils";
import { db } from "@/lib/db";

function PriorityDot({ priority }: { priority: number }) {
  if (priority === 0) return null;
  const color =
    priority === 1 || priority === 2
      ? "bg-red-500"
      : priority === 3
      ? "bg-amber-400"
      : "bg-blue-400";
  return <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${color}`} />;
}

function columnDotClass(type: string): string {
  if (type === "started") return "bg-accent";
  if (type === "triage") return "bg-amber-400";
  return "bg-muted-foreground/40";
}

function KanbanCard({ issue }: { issue: LinearIssue }) {
  const dueDateTs = issue.dueDate ? dateStringToTimestamp(issue.dueDate) : null;
  const dueDateLabel = dueDateTs ? formatDueDate(dueDateTs) : null;
  const isOverdue =
    dueDateTs !== null && dueDateTs < new Date().setHours(0, 0, 0, 0);

  return (
    <a
      href={issue.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-1.5 px-3 py-2.5 bg-card border-2 border-border rounded-xl shadow-sm hover:border-accent/40 transition-all"
    >
      <div className="flex items-start gap-2">
        <PriorityDot priority={issue.priority} />
        <span className="flex-1 text-sm text-foreground leading-snug line-clamp-2">
          {issue.title}
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground mt-0.5"
        >
          <path
            d="M1.5 8.5l7-7M5 1.5h3.5v3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5">
          {issue.team.name}
        </span>
        {dueDateLabel && (
          <span
            className={`text-xs rounded px-1.5 py-0.5 ${
              isOverdue ? "text-overdue" : "text-muted-foreground"
            }`}
          >
            {dueDateLabel}
          </span>
        )}
      </div>
    </a>
  );
}

export default function LinearSection() {
  const { data: settingsData } = db.useQuery({ userSettings: {} });
  const linearApiKey = settingsData?.userSettings?.[0]?.linearApiKey ?? null;

  const [issues, setIssues] = useState<LinearIssue[]>([]);
  const [status, setStatus] = useState<"loading" | "done">("loading");

  useEffect(() => {
    if (!linearApiKey) {
      setStatus("done");
      return;
    }
    fetch("/api/linear", {
      headers: { "X-Linear-Api-Key": linearApiKey },
    })
      .then((r) => {
        if (!r.ok) throw new Error("non-200");
        return r.json() as Promise<LinearApiResponse>;
      })
      .then((data) => {
        setIssues(data.issues ?? []);
        setStatus("done");
      })
      .catch(() => setStatus("done"));
  }, [linearApiKey]);

  const columns = useMemo(() => {
    const map = new Map<string, { type: string; issues: LinearIssue[] }>();
    for (const issue of issues) {
      const key = issue.state.name;
      if (!map.has(key)) map.set(key, { type: issue.state.type, issues: [] });
      map.get(key)!.issues.push(issue);
    }
    return [...map.entries()]
      .sort(([nameA, a], [nameB, b]) => {
        const orderA = STATE_TYPE_ORDER[a.type] ?? 99;
        const orderB = STATE_TYPE_ORDER[b.type] ?? 99;
        return orderA !== orderB ? orderA - orderB : nameA.localeCompare(nameB);
      })
      .map(([name, { type, issues: colIssues }]) => ({
        name,
        type,
        issues: colIssues.sort((a, b) => {
          const pa = a.priority === 0 ? 99 : a.priority;
          const pb = b.priority === 0 ? 99 : b.priority;
          return pa !== pb ? pa - pb : a.title.localeCompare(b.title);
        }),
      }));
  }, [issues]);

  if (status === "loading" || issues.length === 0) return null;

  return (
    <div className="mt-4">
      {/* Header: Linear triangle icon + label + count */}
      <div className="flex items-center gap-2 px-1 mb-2">
        <span className="text-muted-foreground">
          <svg width="12" height="12" viewBox="0 0 100 100" fill="currentColor">
            <path d="M1.22 61.82L38.18 98.78a3.08 3.08 0 004.24 0l55.36-55.36a3 3 0 000-4.24L60.82 1.72a3.08 3.08 0 00-4.24 0L1.22 57.58a3 3 0 000 4.24z" />
          </svg>
        </span>
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Linear
        </span>
        <span className="bg-muted text-muted-foreground rounded-md px-1.5 py-0.5 text-xs font-medium">
          {issues.length}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-border rounded-full mb-3" />

      {/* Kanban board — horizontally scrollable */}
      <div className="overflow-x-auto -mx-1 px-1 pb-1">
        <div className="flex gap-3" style={{ minWidth: "max-content" }}>
          {columns.map((col) => (
            <div key={col.name} className="w-52 shrink-0 flex flex-col gap-2">
              {/* Column header */}
              <div className="flex items-center gap-2 px-1">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${columnDotClass(col.type)}`}
                />
                <span className="text-xs font-semibold text-foreground truncate flex-1">
                  {col.name}
                </span>
                <span className="text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                  {col.issues.length}
                </span>
              </div>
              {/* Cards */}
              <div className="flex flex-col gap-2">
                {col.issues.map((issue) => (
                  <KanbanCard key={issue.id} issue={issue} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
