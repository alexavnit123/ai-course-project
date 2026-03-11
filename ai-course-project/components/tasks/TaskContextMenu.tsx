"use client";

import { useEffect, useRef } from "react";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

interface TaskContextMenuProps {
  taskId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TaskContextMenu({
  taskId,
  isOpen,
  onOpenChange,
}: TaskContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onOpenChange]);

  const handleDelete = () => {
    db.transact(db.tx.tasks[taskId].delete());
    onOpenChange(false);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpenChange(!isOpen);
        }}
        className={cn(
          "w-7 h-7 flex items-center justify-center rounded-lg transition-colors",
          isOpen
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        aria-label="Task options"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="2.5" r="1.25" fill="currentColor" />
          <circle cx="7" cy="7" r="1.25" fill="currentColor" />
          <circle cx="7" cy="11.5" r="1.25" fill="currentColor" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 w-36 bg-card border-2 border-border rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.08)] py-1">
          <button
            onClick={handleDelete}
            className="w-full px-3 py-2 text-left text-sm text-overdue hover:bg-overdue-light transition-colors flex items-center gap-2"
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
            Delete task
          </button>
        </div>
      )}
    </div>
  );
}
