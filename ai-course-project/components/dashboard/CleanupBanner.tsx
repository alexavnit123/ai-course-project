"use client";
import Button from "@/components/ui/Button";

interface CleanupBannerProps {
  completedCount: number;
  showNotification: boolean;
  onCleanup: () => void;
  onDismiss: () => void;
}

export default function CleanupBanner({
  completedCount,
  showNotification,
  onCleanup,
  onDismiss,
}: CleanupBannerProps) {
  const taskLabel = completedCount === 1 ? "task" : "tasks";

  if (showNotification) {
    return (
      <div className="rounded-2xl border-2 border-accent/60 bg-accent-light p-4 shadow-[4px_4px_0px_0px_rgba(108,92,231,0.12)] flex flex-col gap-3">
        <div className="flex items-start gap-2.5">
          <span className="text-xl shrink-0 mt-0.5">🧹</span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Time for your weekly clean-up!
            </p>
            {completedCount > 0 ? (
              <p className="text-xs text-muted-foreground mt-0.5">
                You have {completedCount} completed {taskLabel} to archive.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">
                No completed tasks to archive right now.
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onDismiss} className="flex-1">
            Dismiss
          </Button>
          <Button
            size="sm"
            onClick={onCleanup}
            disabled={completedCount === 0}
            className="flex-1"
          >
            Clean up →
          </Button>
        </div>
      </div>
    );
  }

  if (completedCount === 0) {
    return (
      <div className="rounded-2xl border-2 border-border bg-card p-4 shadow-[4px_4px_0px_0px_rgba(108,92,231,0.06)] flex items-center gap-3">
        <span className="text-lg">🧹</span>
        <p className="text-sm text-muted-foreground flex-1">All clean</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-border bg-card p-4 shadow-[4px_4px_0px_0px_rgba(108,92,231,0.06)] flex items-center gap-3">
      <span className="text-lg shrink-0">🧹</span>
      <p className="text-sm text-foreground flex-1">
        <span className="font-semibold">{completedCount}</span>{" "}
        <span className="text-muted-foreground">completed {taskLabel}</span>
      </p>
      <button
        onClick={onCleanup}
        className="text-xs font-semibold text-accent hover:opacity-70 transition-opacity shrink-0"
      >
        Clean up →
      </button>
    </div>
  );
}
