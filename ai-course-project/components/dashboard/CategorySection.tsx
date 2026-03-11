"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Category, CATEGORY_LABELS, SortMode } from "@/lib/constants";
import { isOverdue, cn } from "@/lib/utils";
import TaskList from "./TaskList";
import CompletedSection from "./CompletedSection";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";
import { TaskWithCompletions } from "./TaskCard";

interface CategorySectionProps {
  category: Category;
  variant?: "daily" | "standard";
  tasks: TaskWithCompletions[];
  today: string;
  userId: string;
  progressLabel?: string; // e.g. "3/5" shown only on daily variant
}

const categoryIcons: Record<Category, React.ReactNode> = {
  daily: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path
        d="M7.5 1v2M7.5 12v2M1 7.5h2M12 7.5h2M3.05 3.05l1.414 1.414M10.536 10.536l1.414 1.414M3.05 11.95l1.414-1.414M10.536 4.464l1.414-1.414"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="7.5" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  personal: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="7.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M2 13c0-3.038 2.462-5.5 5.5-5.5S13 9.962 13 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  business: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="1.5" y="5.5" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 5.5V4a2 2 0 014 0v1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

export default function CategorySection({
  category,
  variant = "standard",
  tasks,
  today,
  userId,
  progressLabel,
}: CategorySectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("manual");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const isDaily = variant === "daily";

  // Close sort dropdown on click-outside
  useEffect(() => {
    if (!sortOpen) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sortOpen]);

  const { activeTasks, completedTasks, maxSortOrder } = useMemo(() => {
    const isTaskCompleted = (t: TaskWithCompletions) =>
      t.isDaily ? t.dailyCompletions.length > 0 : t.completed;

    const active = tasks
      .filter((t) => !isTaskCompleted(t))
      .sort((a, b) => {
        if (sortMode === "priority") {
          const pa = a.priority ?? 99;
          const pb = b.priority ?? 99;
          if (pa !== pb) return pa - pb;
          return a.sortOrder - b.sortOrder;
        }
        if (sortMode === "dueDate") {
          const da = a.dueDate ?? Infinity;
          const db = b.dueDate ?? Infinity;
          if (da !== db) return da - db;
          return a.sortOrder - b.sortOrder;
        }
        // manual: overdue first, then sortOrder
        const aOverdue = isOverdue(a.dueDate, a.completed, a.isDaily);
        const bOverdue = isOverdue(b.dueDate, b.completed, b.isDaily);
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        return a.sortOrder - b.sortOrder;
      });

    const completed = tasks
      .filter((t) => isTaskCompleted(t))
      .sort((a, b) => b.sortOrder - a.sortOrder);

    const maxOrder =
      tasks.length > 0 ? Math.max(...tasks.map((t) => t.sortOrder)) : 0;

    return { activeTasks: active, completedTasks: completed, maxSortOrder: maxOrder };
  }, [tasks, sortMode]);

  const overdueCount = activeTasks.filter((t) =>
    isOverdue(t.dueDate, t.completed, t.isDaily)
  ).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <span className={isDaily ? "text-accent" : "text-accent"}>
            {categoryIcons[category]}
          </span>
          <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">
            {isDaily ? "Daily Habits" : CATEGORY_LABELS[category]}
          </h2>
          {/* Daily progress pill */}
          {isDaily && progressLabel && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-accent text-white">
              {progressLabel}
            </span>
          )}
          {/* Overdue badge (non-daily only) */}
          {!isDaily && overdueCount > 0 && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-overdue text-white text-[10px] font-bold">
              {overdueCount}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {tasks.length > 0 && (
          <div className={cn(
            "flex-1 rounded-full overflow-hidden self-center",
            isDaily ? "h-1.5 bg-accent/15" : "h-1 bg-muted"
          )}>
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                completedTasks.length === tasks.length
                  ? "bg-success"
                  : isDaily
                  ? "bg-accent"
                  : "bg-accent/70"
              )}
              style={{ width: `${(completedTasks.length / tasks.length) * 100}%` }}
            />
          </div>
        )}

        {/* Sort dropdown */}
        <div className="relative shrink-0" ref={sortRef}>
          <button
            onClick={() => setSortOpen((v) => !v)}
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded-xl border-2 transition-all",
              sortMode !== "manual"
                ? "border-accent text-accent bg-accent-light"
                : isDaily
                ? "border-accent/40 text-accent/60 hover:border-accent hover:text-accent"
                : "border-border text-muted-foreground hover:border-accent hover:text-accent hover:bg-accent-light"
            )}
            aria-label="Sort tasks"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 3h10M3 6h6M5 9h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {sortOpen && (
            <div className="absolute right-0 top-9 z-20 bg-card border-2 border-border rounded-xl shadow-[4px_4px_0px_0px_rgba(108,92,231,0.1)] min-w-[140px] overflow-hidden">
              {(
                [
                  { mode: "manual" as SortMode, label: "Manual" },
                  { mode: "priority" as SortMode, label: "Priority" },
                  { mode: "dueDate" as SortMode, label: "Due Date" },
                ] as const
              ).map(({ mode, label }) => (
                <button
                  key={mode}
                  onClick={() => {
                    setSortMode(mode);
                    setSortOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors",
                    sortMode === mode
                      ? "text-accent bg-accent-light font-semibold"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  {sortMode === mode && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0">
                      <path d="M1.5 5l2.5 2.5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {sortMode !== mode && <span className="w-2.5" />}
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className={cn(
            "shrink-0 w-7 h-7 flex items-center justify-center rounded-xl border-2 transition-all",
            isDaily
              ? "border-accent/40 text-accent hover:border-accent hover:bg-accent/10"
              : "border-border text-muted-foreground hover:border-accent hover:text-accent hover:bg-accent-light"
          )}
          aria-label={`Add ${category} task`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Divider */}
      <div className={`h-0.5 rounded-full ${isDaily ? "bg-accent/20" : "bg-border"}`} />

      {/* Task list */}
      {activeTasks.length === 0 && completedTasks.length === 0 ? (
        <button
          onClick={() => setIsModalOpen(true)}
          className={
            isDaily
              ? "flex items-center gap-3 py-4 px-4 rounded-xl border-2 border-dashed border-accent/30 text-accent/60 hover:border-accent/60 hover:text-accent hover:bg-accent/5 transition-all group"
              : "flex flex-col items-center gap-2 py-8 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-accent/50 hover:text-accent hover:bg-accent-light/30 transition-all group"
          }
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="group-hover:scale-110 transition-transform shrink-0"
          >
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="text-xs font-medium">
            {isDaily ? "Add a daily habit" : "Add a task"}
          </span>
        </button>
      ) : (
        <>
          <TaskList
            tasks={activeTasks}
            today={today}
            userId={userId}
            dailyVariant={isDaily}
          />
          <CompletedSection tasks={completedTasks} today={today} userId={userId} dailyVariant={isDaily} />
        </>
      )}

      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultCategory={category}
        userId={userId}
        maxSortOrder={maxSortOrder}
      />
    </div>
  );
}
