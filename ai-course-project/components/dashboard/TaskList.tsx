"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { db } from "@/lib/db";
import TaskCard, { TaskWithCompletions } from "./TaskCard";

interface TaskListProps {
  tasks: TaskWithCompletions[];
  today: string;
  userId: string;
  dailyVariant?: boolean;
}

export default function TaskList({ tasks, today, userId, dailyVariant }: TaskListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove([...tasks], oldIndex, newIndex);
    const prev = reordered[newIndex - 1];
    const next = reordered[newIndex + 1];

    let newSortOrder: number;
    if (!prev && !next) {
      newSortOrder = 0;
    } else if (!prev) {
      newSortOrder = next.sortOrder - 1000;
    } else if (!next) {
      newSortOrder = prev.sortOrder + 1000;
    } else {
      newSortOrder = (prev.sortOrder + next.sortOrder) / 2;
    }

    db.transact(
      db.tx.tasks[active.id as string].update({ sortOrder: newSortOrder })
    );
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  if (tasks.length === 0) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-1.5">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} today={today} userId={userId} dailyVariant={dailyVariant} />
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="opacity-95 rotate-1 scale-105">
            <TaskCard
              task={activeTask}
              today={today}
              userId={userId}
              isOverlay
              dailyVariant={dailyVariant}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
