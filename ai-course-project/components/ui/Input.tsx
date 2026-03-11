"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold text-foreground"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full px-4 py-2.5 rounded-xl border-2 border-border bg-card text-foreground",
            "placeholder:text-muted-foreground",
            "hover:border-accent/50",
            "focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20",
            "transition-all duration-150",
            error && "border-overdue focus:border-overdue focus:ring-overdue/20",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-overdue">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
