"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { CSS } from "@dnd-kit/utilities";
import type { DraggableAttributes } from "@dnd-kit/core";
import { InstaQLEntity } from "@instantdb/react";
import { id } from "@instantdb/react";
import { AppSchema } from "@/instant.schema";
import { db } from "@/lib/db";
import Badge from "@/components/ui/Badge";
import { isOverdue, formatDueDate, cn } from "@/lib/utils";
import TaskContextMenu from "@/components/tasks/TaskContextMenu";
import TaskDetailModal from "@/components/tasks/TaskDetailModal";

export type TaskWithCompletions = InstaQLEntity<
  AppSchema,
  "tasks",
  { dailyCompletions: {} }
>;

interface TaskCardProps {
  task: TaskWithCompletions;
  today: string;
  userId: string;
  isOverlay?: boolean;
}

function TaskCheckbox({
  checked,
  onToggle,
  isDaily,
}: {
  checked: boolean;
  onToggle: () => void;
  isDaily: boolean;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={cn(
        "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-150 shrink-0",
        checked
          ? "bg-accent border-accent"
          : isDaily
          ? "border-accent/40 hover:border-accent bg-accent-light/30"
          : "border-border hover:border-accent bg-transparent"
      )}
      aria-label={checked ? "Mark incomplete" : "Mark complete"}
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 6l2.5 2.5L10 3"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

// Presentation-only card (used in DragOverlay and as base)
export function TaskCardContent({
  task,
  today,
  userId,
  dragListeners,
  dragAttributes,
  isDragging = false,
}: TaskCardProps & {
  dragListeners?: SyntheticListenerMap;
  dragAttributes?: DraggableAttributes;
  isDragging?: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const isCompleted = task.isDaily
    ? task.dailyCompletions.length > 0
    : task.completed;
  const overdue = isOverdue(task.dueDate, task.completed, task.isDaily);

  const handleToggle = () => {
    if (task.isDaily) {
      if (task.dailyCompletions.length > 0) {
        const completion = task.dailyCompletions[0];
        db.transact(db.tx.dailyCompletions[completion.id].delete());
      } else {
        const completionId = id();
        db.transact(
          db.tx.dailyCompletions[completionId]
            .create({ dateString: today, completedAt: Date.now(), ownerId: userId })
            .link({ task: task.id, owner: userId })
        );
      }
    } else {
      db.transact(db.tx.tasks[task.id].update({ completed: !task.completed }));
    }
  };

  return (
    <>
      <div
        onClick={() => !isDragging && setIsDetailOpen(true)}
        className={cn(
          "group flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 border-border bg-card",
          "shadow-[3px_3px_0px_0px_rgba(0,0,0,0.04)]",
          "hover:border-accent/40 hover:shadow-[3px_3px_0px_0px_rgba(108,92,231,0.08)]",
          "transition-all duration-150 cursor-pointer",
          isDragging && "opacity-40",
          overdue && !isCompleted && "border-overdue/30 bg-overdue-light/20"
        )}
      >
        {/* Drag handle */}
        <button
          {...dragListeners}
          {...dragAttributes}
          onClick={(e) => e.stopPropagation()}
          className="text-border group-hover:text-muted-foreground hover:!text-accent transition-colors touch-none cursor-grab active:cursor-grabbing shrink-0"
          aria-label="Drag to reorder"
          tabIndex={-1}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="4.5" cy="3.5" r="1" fill="currentColor" />
            <circle cx="9.5" cy="3.5" r="1" fill="currentColor" />
            <circle cx="4.5" cy="7" r="1" fill="currentColor" />
            <circle cx="9.5" cy="7" r="1" fill="currentColor" />
            <circle cx="4.5" cy="10.5" r="1" fill="currentColor" />
            <circle cx="9.5" cy="10.5" r="1" fill="currentColor" />
          </svg>
        </button>

        {/* Checkbox */}
        <TaskCheckbox
          checked={isCompleted}
          onToggle={handleToggle}
          isDaily={task.isDaily}
        />

        {/* Title + description hint */}
        <div className="flex-1 min-w-0">
          <span
            className={cn(
              "block text-sm text-foreground truncate",
              isCompleted && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </span>
          {task.description && (
            <span className="block text-xs text-muted-foreground truncate mt-0.5">
              {task.description}
            </span>
          )}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 shrink-0">
          {overdue && !isCompleted && (
            <Badge variant="overdue">Overdue</Badge>
          )}
          {task.dueDate && (
            <Badge variant={overdue && !isCompleted ? "overdue" : "muted"}>
              {formatDueDate(task.dueDate)}
            </Badge>
          )}
        </div>

        {/* Context menu */}
        <div
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <TaskContextMenu
            taskId={task.id}
            isOpen={showMenu}
            onOpenChange={setShowMenu}
          />
        </div>
      </div>

      <TaskDetailModal
        task={task}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </>
  );
}

// Sortable wrapper (used in the actual list)
export default function TaskCard({
  task,
  today,
  userId,
  isOverlay,
}: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isOverlay) {
    return <TaskCardContent task={task} today={today} userId={userId} />;
  }

  return (
    <div ref={setNodeRef} style={style}>
      <TaskCardContent
        task={task}
        today={today}
        userId={userId}
        dragListeners={listeners}
        dragAttributes={attributes}
        isDragging={isDragging}
      />
    </div>
  );
}
