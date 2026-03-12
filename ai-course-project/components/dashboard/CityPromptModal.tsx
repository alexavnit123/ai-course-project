"use client";
import { useState } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface CityPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  existingSettingsId?: string;
}

export default function CityPromptModal({
  isOpen,
  onClose,
  userId,
  existingSettingsId,
}: CityPromptModalProps) {
  const [city, setCity] = useState("");
  const [status, setStatus] = useState<"idle" | "validating" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleClose() {
    setCity("");
    setStatus("idle");
    setErrorMessage(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = city.trim();
    if (!trimmed) return;

    setStatus("validating");
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (data.error === "city_not_found") {
        setStatus("error");
        setErrorMessage("City not found. Try a different name.");
        return;
      }

      if (data.error) {
        setStatus("error");
        setErrorMessage("Could not validate city. Please try again.");
        return;
      }

      // Save the city name returned by the geocoder (canonical form)
      const canonicalCity = (data.city as string).split(",")[0].trim();

      if (existingSettingsId) {
        db.transact(
          db.tx.userSettings[existingSettingsId].update({ weatherCity: canonicalCity })
        );
      } else {
        const newId = id();
        db.transact(
          db.tx.userSettings[newId]
            .create({ weatherCity: canonicalCity, ownerId: userId })
            .link({ owner: userId })
        );
      }

      handleClose();
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Where are you based?">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <p className="text-sm text-muted-foreground -mt-2">
          We&apos;ll show the local weather forecast on your dashboard.
        </p>
        <Input
          label="City"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="e.g. London, New York, Tokyo"
          autoFocus
          disabled={status === "validating"}
          error={errorMessage ?? undefined}
        />
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
            disabled={status === "validating" || !city.trim()}
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
                Checking…
              </>
            ) : (
              "Set City"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
