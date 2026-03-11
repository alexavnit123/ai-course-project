"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import { CATEGORIES, CATEGORY_LABELS, Category } from "@/lib/constants";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import DatePicker from "@/components/ui/DatePicker";
import { TaskWithCompletions } from "@/components/dashboard/TaskCard";

interface TaskDetailModalProps {
  task: TaskWithCompletions;
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskDetailModal({
  task,
  isOpen,
  onClose,
}: TaskDetailModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [category, setCategory] = useState<Category>(task.category as Category);
  const [dueDate, setDueDate] = useState<number | undefined>(task.dueDate ?? undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when task changes (modal re-opened for a different task)
  const handleClose = () => {
    setTitle(task.title);
    setDescription(task.description ?? "");
    setCategory(task.category as Category);
    setDueDate(task.dueDate ?? undefined);
    setError(null);
    onClose();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Title is required.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const isDaily = category === "daily";
      await db.transact(
        db.tx.tasks[task.id].update({
          title: trimmed,
          description: description.trim() || undefined,
          category,
          isDaily,
          ...(dueDate !== undefined ? { dueDate } : { dueDate: undefined }),
        })
      );
      onClose();
    } catch {
      setError("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    await db.transact(db.tx.tasks[task.id].delete());
    onClose();
  };

  const isCompleted = task.isDaily
    ? task.dailyCompletions.length > 0
    : task.completed;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Task details" className="max-w-lg">
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        {/* Status indicator */}
        {isCompleted && (
          <div className="flex items-center gap-2 px-3 py-2 bg-success/10 rounded-xl border border-success/20">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-success shrink-0">
              <path d="M2 7l3 3 7-6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs font-semibold text-success">Completed</span>
          </div>
        )}

        {/* Title */}
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          autoFocus
          error={error ?? undefined}
        />

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-foreground">
            Description{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more details about this task…"
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-150 resize-none"
          />
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-foreground">Category</label>
          <div className="flex gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`flex-1 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                  category === cat
                    ? "border-accent bg-accent-light text-accent"
                    : "border-border text-muted-foreground hover:border-accent/50 hover:text-foreground"
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Due date — hidden for daily tasks */}
        {category !== "daily" && (
          <div className="relative">
            <DatePicker
              label={
                <>
                  Due date{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </>
              }
              value={dueDate}
              onChange={setDueDate}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t-2 border-border mt-1">
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleDelete}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path
                d="M1.5 3.5h10M4.5 3.5V2.5a1 1 0 011-1h2a1 1 0 011 1v1M5.5 6v4M7.5 6v4M2.5 3.5l.75 7a1 1 0 001 .9h4.5a1 1 0 001-.9l.75-7"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Delete
          </Button>
          <div className="flex-1" />
          <Button type="button" variant="secondary" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
