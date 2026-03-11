"use client";

import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { cn, formatDueDate, dateStringToTimestamp } from "@/lib/utils";

interface DatePickerProps {
  label?: React.ReactNode;
  value?: number | null; // Unix ms timestamp
  onChange: (value: number | undefined) => void;
  placeholder?: string;
}

export default function DatePicker({
  label,
  value,
  onChange,
  placeholder = "Pick a date",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = value ? new Date(value) : undefined;

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const handleSelect = (day: Date | undefined) => {
    if (!day) {
      onChange(undefined);
    } else {
      // Normalise to start of local day
      const str = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
      onChange(dateStringToTimestamp(str));
    }
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold text-foreground">{label}</label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-2.5 rounded-xl border-2 text-sm transition-all duration-150",
          isOpen
            ? "border-accent ring-2 ring-accent/20"
            : "border-border hover:border-accent/50",
          value ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <span className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-muted-foreground">
            <rect x="1" y="2" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
            <path d="M1 6h12M4.5 1v2M9.5 1v2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
          </svg>
          {value ? formatDueDate(value) : placeholder}
        </span>
        {value && (
          <span
            onClick={handleClear}
            className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
            role="button"
            aria-label="Clear date"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M10 2L2 10M2 2l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
        )}
      </button>

      {/* Calendar popover */}
      {isOpen && (
        <div className="absolute z-50 mt-1 bg-card border-2 border-border rounded-2xl shadow-[6px_6px_0px_0px_rgba(108,92,231,0.12)] p-3">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            showOutsideDays
            classNames={{
              root: "font-sans text-sm",
              months: "flex flex-col",
              month: "space-y-2",
              month_caption: "flex justify-between items-center px-1 pb-1",
              caption_label: "text-sm font-bold text-foreground",
              nav: "flex items-center gap-1",
              button_previous: "w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
              button_next: "w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
              weeks: "space-y-1",
              weekdays: "flex gap-1",
              weekday: "w-8 h-6 flex items-center justify-center text-[11px] font-semibold text-muted-foreground uppercase",
              week: "flex gap-1",
              day: "w-8 h-8 flex items-center justify-center",
              day_button: "w-8 h-8 rounded-xl text-xs font-medium transition-all cursor-pointer hover:bg-muted text-foreground",
              selected: "[&>button]:bg-accent [&>button]:text-white [&>button]:hover:bg-accent/90",
              today: "[&>button]:font-bold [&>button]:text-accent",
              outside: "[&>button]:text-muted-foreground/40",
              disabled: "[&>button]:opacity-30 [&>button]:cursor-not-allowed",
            }}
          />
        </div>
      )}
    </div>
  );
}
