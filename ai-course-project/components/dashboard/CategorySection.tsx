"use client";

import { useState, useMemo } from "react";
import { Category, CATEGORY_LABELS } from "@/lib/constants";
import { isOverdue } from "@/lib/utils";
import TaskList from "./TaskList";
import CompletedSection from "./CompletedSection";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";
import { TaskWithCompletions } from "./TaskCard";

interface CategorySectionProps {
  category: Category;
  tasks: TaskWithCompletions[];
  today: string;
  userId: string;
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
      <rect
        x="1.5"
        y="5.5"
        width="12"
        height="8"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5 5.5V4a2 2 0 014 0v1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
};

export default function CategorySection({
  category,
  tasks,
  today,
  userId,
}: CategorySectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { activeTasks, completedTasks, maxSortOrder } = useMemo(() => {
    const isTaskCompleted = (t: TaskWithCompletions) =>
      t.isDaily ? t.dailyCompletions.length > 0 : t.completed;

    const active = tasks
      .filter((t) => !isTaskCompleted(t))
      .sort((a, b) => {
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
  }, [tasks]);

  const overdueCount = activeTasks.filter((t) =>
    isOverdue(t.dueDate, t.completed, t.isDaily)
  ).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Category header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-accent">{categoryIcons[category]}</span>
          <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">
            {CATEGORY_LABELS[category]}
          </h2>
          {overdueCount > 0 && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-overdue text-white text-[10px] font-bold">
              {overdueCount}
            </span>
          )}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-7 h-7 flex items-center justify-center rounded-xl border-2 border-border text-muted-foreground hover:border-accent hover:text-accent hover:bg-accent-light transition-all"
          aria-label={`Add ${category} task`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M6 1v10M1 6h10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Divider */}
      <div className="h-0.5 bg-border rounded-full" />

      {/* Task list */}
      {activeTasks.length === 0 && completedTasks.length === 0 ? (
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex flex-col items-center gap-2 py-8 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-accent/50 hover:text-accent hover:bg-accent-light/30 transition-all group"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="group-hover:scale-110 transition-transform"
          >
            <path
              d="M10 4v12M4 10h12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-xs font-medium">Add a task</span>
        </button>
      ) : (
        <>
          <TaskList tasks={activeTasks} today={today} userId={userId} />
          <CompletedSection
            tasks={completedTasks}
            today={today}
            userId={userId}
          />
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
