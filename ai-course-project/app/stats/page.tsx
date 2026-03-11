"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { cn, getTodayString } from "@/lib/utils";
import { InstaQLEntity } from "@instantdb/react";
import { AppSchema } from "@/instant.schema";

type DailyTaskWithCompletions = InstaQLEntity<
  AppSchema,
  "tasks",
  { dailyCompletions: {} }
>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dateStringFromYearMonthDay(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// Monday = 0 … Sunday = 6
function firstWeekdayOfMonth(year: number, month: number): number {
  const d = new Date(year, month - 1, 1).getDay(); // 0=Sun
  return (d + 6) % 7; // convert to Mon-first
}

function formatDayHeading(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// ─── Stat Cards ───────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent?: boolean;
}

function StatCard({ label, value, sub, icon, accent }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border-2 bg-card p-5 shadow-[4px_4px_0px_0px_rgba(108,92,231,0.06)] flex flex-col gap-3",
        accent && "border-accent/30 bg-accent-light/30"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <span className={cn("text-xl", accent ? "text-accent" : "text-muted-foreground/60")}>
          {icon}
        </span>
      </div>
      <div>
        <span className={cn("text-3xl font-black tracking-tight", accent ? "text-accent" : "text-foreground")}>
          {value}
        </span>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const today = getTodayString();
  const [year, month] = today.split("-").map(Number);

  const [viewYear, setViewYear] = useState(year);
  const [viewMonth, setViewMonth] = useState(month);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { data, isLoading, error } = db.useQuery({
    tasks: {
      $: { where: { isDaily: true } },
      dailyCompletions: {},
    },
  });

  const tasks = (data?.tasks ?? []) as DailyTaskWithCompletions[];

  // Build a map of dateString → Set of completed taskIds
  const completionMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const task of tasks) {
      for (const c of task.dailyCompletions) {
        if (!map.has(c.dateString)) map.set(c.dateString, new Set());
        map.get(c.dateString)!.add(task.id);
      }
    }
    return map;
  }, [tasks]);

  // ── Summary stats ──────────────────────────────────────────────────────────

  const { currentStreak, bestStreak, thisMonthPct, totalCompletions } = useMemo(() => {
    const totalCompletions = tasks.reduce((sum, t) => sum + t.dailyCompletions.length, 0);

    // Streak: consecutive days back from yesterday where at least 1 task was done
    let currentStreak = 0;
    let bestStreak = 0;
    let runningStreak = 0;
    const todayDate = new Date(year, month - 1, parseInt(today.split("-")[2]));

    // Collect all unique date strings that had any completion
    const datesWithActivity = new Set(completionMap.keys());

    // Walk back up to 365 days to compute streaks
    let prevStreak = 0;
    for (let i = 1; i <= 365; i++) {
      const d = new Date(todayDate);
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (datesWithActivity.has(ds)) {
        runningStreak++;
        if (i === prevStreak + 1 || prevStreak === 0) {
          // contiguous — handled below
        }
      } else {
        runningStreak = 0;
      }
      prevStreak = i;
      if (runningStreak > bestStreak) bestStreak = runningStreak;
    }

    // Simpler streak calculation: consecutive days ending yesterday
    currentStreak = 0;
    for (let i = 1; i <= 365; i++) {
      const d = new Date(todayDate);
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (datesWithActivity.has(ds)) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Best streak: sliding window through sorted dates
    bestStreak = currentStreak; // start from current
    const sortedDates = [...datesWithActivity].sort();
    let streak = 0;
    let prevTs: number | null = null;
    for (const ds of sortedDates) {
      const [sy, sm, sd] = ds.split("-").map(Number);
      const ts = new Date(sy, sm - 1, sd).getTime();
      if (prevTs !== null && ts - prevTs === 86400000) {
        streak++;
      } else {
        streak = 1;
      }
      if (streak > bestStreak) bestStreak = streak;
      prevTs = ts;
    }

    // This month %: avg completion rate for past days in current month
    const daysElapsed = parseInt(today.split("-")[2]);
    let rateSum = 0;
    for (let d = 1; d <= daysElapsed; d++) {
      const ds = dateStringFromYearMonthDay(year, month, d);
      const done = completionMap.get(ds)?.size ?? 0;
      rateSum += tasks.length > 0 ? done / tasks.length : 0;
    }
    const thisMonthPct =
      tasks.length > 0 && daysElapsed > 0
        ? Math.round((rateSum / daysElapsed) * 100)
        : 0;

    return { currentStreak, bestStreak, thisMonthPct, totalCompletions };
  }, [tasks, completionMap, today, year, month]);

  // ── Calendar data ──────────────────────────────────────────────────────────

  const calendarDays = useMemo(() => {
    const totalDays = daysInMonth(viewYear, viewMonth);
    const firstOffset = firstWeekdayOfMonth(viewYear, viewMonth);
    const cells: Array<{ day: number | null; dateStr: string | null }> = [];
    for (let i = 0; i < firstOffset; i++) cells.push({ day: null, dateStr: null });
    for (let d = 1; d <= totalDays; d++) {
      cells.push({ day: d, dateStr: dateStringFromYearMonthDay(viewYear, viewMonth, d) });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const isCurrentMonth = viewYear === year && viewMonth === month;

  const goToPrevMonth = () => {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else setViewMonth(m => m - 1);
  };
  const goToNextMonth = () => {
    if (isCurrentMonth) return;
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else setViewMonth(m => m + 1);
  };

  const monthLabel = new Date(viewYear, viewMonth - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // ── Selected day detail ────────────────────────────────────────────────────

  const selectedDayCompletions = selectedDay ? completionMap.get(selectedDay) : null;

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div role="status" aria-label="Loading">
          <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-overdue py-12 text-center">
        Failed to load stats. Please refresh.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">Daily Habits</h1>
        <p className="text-sm text-muted-foreground mt-1">Your completion history at a glance</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Current Streak"
          value={currentStreak}
          sub={currentStreak === 1 ? "day" : "days"}
          icon={<span>🔥</span>}
          accent={currentStreak > 0}
        />
        <StatCard
          label="Best Streak"
          value={bestStreak}
          sub={bestStreak === 1 ? "day" : "days"}
          icon={<span>⭐</span>}
        />
        <StatCard
          label="This Month"
          value={`${thisMonthPct}%`}
          sub="avg completion rate"
          icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 14l4-4 3 3 4-5 3 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        <StatCard
          label="All-Time"
          value={totalCompletions}
          sub="total completions"
          icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 9l4 4 8-8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
      </div>

      {/* Calendar card */}
      <div className="rounded-2xl border-2 border-border bg-card p-5 sm:p-6 shadow-[4px_4px_0px_0px_rgba(108,92,231,0.06)]">

        {/* Month navigation */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={goToPrevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-border text-muted-foreground hover:border-accent hover:text-accent transition-all"
            aria-label="Previous month"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M7.5 2.5L4 6l3.5 3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h2 className="text-sm font-bold text-foreground tracking-tight">{monthLabel}</h2>
          <button
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-xl border-2 transition-all",
              isCurrentMonth
                ? "border-border/40 text-muted-foreground/30 cursor-not-allowed"
                : "border-border text-muted-foreground hover:border-accent hover:text-accent"
            )}
            aria-label="Next month"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {tasks.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-accent-light border-2 border-accent/30 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.75" className="text-accent" />
                <path d="M6.5 10l2.5 2.5 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-accent" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-foreground">No daily habits yet</p>
            <p className="text-xs text-muted-foreground">
              Add some from the{" "}
              <Link href="/dashboard" className="text-accent hover:underline font-medium">
                Tasks tab
              </Link>
            </p>
          </div>
        ) : (
          <>
            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 mb-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((cell, idx) => {
                if (!cell.day || !cell.dateStr) {
                  return <div key={`empty-${idx}`} />;
                }

                const dateStr = cell.dateStr;
                const isFuture = dateStr > today;
                const isBeforeTracking = dateStr < "2026-03-11";
                const isInactive = isFuture || isBeforeTracking;
                const isToday = dateStr === today;
                const isSelected = dateStr === selectedDay;
                const completedCount = completionMap.get(dateStr)?.size ?? 0;
                const totalCount = tasks.length;
                const rate = totalCount > 0 ? completedCount / totalCount : 0;

                const bgClass =
                  rate === 1 && completedCount > 0
                    ? "bg-success/15 border-success/40 text-success"
                    : completedCount > 0
                    ? "bg-accent/10 border-accent/25 text-accent"
                    : "bg-transparent border-border/50 text-muted-foreground";

                const doneTasks = tasks.filter((t) => completionMap.get(dateStr)?.has(t.id));
                const missedTasks = tasks.filter((t) => !completionMap.get(dateStr)?.has(t.id));

                return (
                  <button
                    key={dateStr}
                    onClick={() => !isInactive && setSelectedDay(isSelected ? null : dateStr)}
                    disabled={isInactive}
                    className={cn(
                      "relative flex flex-col gap-1 border-2 rounded-xl p-1.5 text-left transition-all w-full",
                      isInactive ? "bg-transparent border-border/30 text-muted-foreground/30" : bgClass,
                      isInactive && "opacity-40 cursor-not-allowed",
                      !isInactive && "hover:border-accent/60 cursor-pointer",
                      isToday && "ring-2 ring-accent ring-offset-1",
                      isSelected && "border-accent shadow-[2px_2px_0px_0px_rgba(108,92,231,0.15)]"
                    )}
                    aria-label={`${dateStr}: ${completedCount}/${totalCount} habits completed`}
                  >
                    {/* Day number */}
                    <span className="text-[10px] font-bold leading-none mb-0.5">{cell.day}</span>

                    {/* Task list — completed first, then missed */}
                    {!isInactive && totalCount > 0 && (
                      <div className="flex flex-col gap-0.5">
                        {doneTasks.map((task) => (
                          <div key={task.id} className="flex items-center gap-0.5 min-w-0">
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="shrink-0 text-success">
                              <path d="M1 4l2 2 4-4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="text-[8px] font-medium leading-tight truncate text-success">
                              {task.title}
                            </span>
                          </div>
                        ))}
                        {missedTasks.map((task) => (
                          <div key={task.id} className="flex items-center gap-0.5 min-w-0">
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="shrink-0 text-overdue/60">
                              <path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                            </svg>
                            <span className="text-[8px] font-medium leading-tight truncate text-muted-foreground/70">
                              {task.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Day detail panel */}
            {selectedDay && (
              <div className="mt-5 pt-5 border-t-2 border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-foreground">
                    {formatDayHeading(selectedDay)}
                  </h3>
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg border-2 border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-all text-xs font-bold"
                    aria-label="Close detail"
                  >
                    ×
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {tasks.map((task) => {
                    const done = selectedDayCompletions?.has(task.id) ?? false;
                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl border-2 border-border bg-background"
                      >
                        <span
                          className={cn(
                            "w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0",
                            done
                              ? "bg-success border-success"
                              : "border-border bg-transparent"
                          )}
                        >
                          {done ? (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M1.5 5l2.5 2.5 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                              <path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" className="text-muted-foreground/50" />
                            </svg>
                          )}
                        </span>
                        <span
                          className={cn(
                            "text-sm",
                            done ? "text-foreground" : "text-muted-foreground"
                          )}
                        >
                          {task.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
