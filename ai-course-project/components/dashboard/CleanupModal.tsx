"use client";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface CleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedCount: number;
  onConfirm: () => void;
}

export default function CleanupModal({
  isOpen,
  onClose,
  completedCount,
  onConfirm,
}: CleanupModalProps) {
  const taskLabel = completedCount === 1 ? "task" : "tasks";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Weekly Clean-up">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-foreground">
            You have{" "}
            <span className="font-semibold">{completedCount} completed {taskLabel}</span>{" "}
            ready to be archived.
          </p>
          <p className="text-xs text-muted-foreground">
            Archived tasks are hidden from your dashboard. You can find and
            restore them any time in{" "}
            <span className="font-medium text-foreground">Settings → Archives</span>.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={completedCount === 0}
            className="flex-1"
          >
            Archive {completedCount} {taskLabel} →
          </Button>
        </div>
      </div>
    </Modal>
  );
}
