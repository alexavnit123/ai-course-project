"use client";

import { useState } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import { CATEGORIES, CATEGORY_LABELS, Category, PRIORITY_OPTIONS, Priority } from "@/lib/constants";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import DatePicker from "@/components/ui/DatePicker";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory: Category;
  userId: string;
  maxSortOrder: number;
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  defaultCategory,
  userId,
  maxSortOrder,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>(defaultCategory);
  const [dueDate, setDueDate] = useState<number | undefined>(undefined);
  const [priority, setPriority] = useState<Priority | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setCategory(defaultCategory);
    setDueDate(undefined);
    setPriority(undefined);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Task title is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const taskId = id();
      const isDaily = category === "daily";
      const newSortOrder = maxSortOrder + 1000;

      await db.transact(
        db.tx.tasks[taskId]
          .create({
            title: trimmed,
            description: description.trim() || undefined,
            category,
            completed: false,
            isDaily,
            sortOrder: newSortOrder,
            createdAt: Date.now(),
            ownerId: userId,
            ...(dueDate !== undefined && { dueDate }),
            ...(priority !== undefined && { priority }),
          })
          .link({ owner: userId })
      );

      handleClose();
    } catch {
      setError("Failed to create task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New task">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
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
            placeholder="Add more details…"
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-150 resize-none"
          />
        </div>

        {/* Priority */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-foreground">Priority</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPriority(undefined)}
              className={`flex-1 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                priority === undefined
                  ? "border-accent bg-accent-light text-accent"
                  : "border-border text-muted-foreground hover:border-accent/50 hover:text-foreground"
              }`}
            >
              None
            </button>
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPriority(opt.value)}
                className={`flex-1 py-2 rounded-xl border-2 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  priority === opt.value
                    ? "border-accent bg-accent-light text-accent"
                    : "border-border text-muted-foreground hover:border-accent/50 hover:text-foreground"
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot}`} />
                {opt.label}
              </button>
            ))}
          </div>
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

        <div className="flex gap-2 mt-2">
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "Adding…" : "Add task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
