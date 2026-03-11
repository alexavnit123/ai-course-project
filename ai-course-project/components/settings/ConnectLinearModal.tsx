"use client";
import { useState } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface ConnectLinearModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  existingSettingsId?: string;
}

export default function ConnectLinearModal({
  isOpen,
  onClose,
  userId,
  existingSettingsId,
}: ConnectLinearModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<"idle" | "validating" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleClose() {
    setApiKey("");
    setStatus("idle");
    setErrorMessage(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const key = apiKey.trim();
    if (!key) return;

    setStatus("validating");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/linear", {
        headers: { "X-Linear-Api-Key": key },
      });
      const data = await res.json();

      if (!data.connected) {
        setStatus("error");
        setErrorMessage("Invalid API key. Please check and try again.");
        return;
      }

      if (existingSettingsId) {
        db.transact(
          db.tx.userSettings[existingSettingsId].update({ linearApiKey: key })
        );
      } else {
        const newId = id();
        db.transact(
          db.tx.userSettings[newId]
            .create({ linearApiKey: key, ownerId: userId })
            .link({ owner: userId })
        );
      }

      handleClose();
    } catch {
      setStatus("error");
      setErrorMessage("Connection failed. Please try again.");
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Connect Linear">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          label="Personal API key"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="lin_api_••••••••••••"
          autoFocus
          disabled={status === "validating"}
          error={errorMessage ?? undefined}
        />
        <p className="text-xs text-muted-foreground -mt-3">
          Find yours at{" "}
          <a
            href="https://linear.app/settings/api"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline underline-offset-2 hover:opacity-80"
          >
            linear.app/settings/api
          </a>
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={status === "validating"}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={status === "validating" || !apiKey.trim()}
            className="flex-1"
          >
            {status === "validating" ? (
              <>
                <svg
                  className="animate-spin w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray="30 70"
                  />
                </svg>
                Validating…
              </>
            ) : (
              "Connect"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
