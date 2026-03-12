"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import AuthGate from "@/components/auth/AuthGate";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import IntegrationCard from "@/components/settings/IntegrationCard";
import Button from "@/components/ui/Button";
import ConnectLinearModal from "@/components/settings/ConnectLinearModal";
import CityPromptModal from "@/components/dashboard/CityPromptModal";

function SettingsContent() {
  const { user } = db.useAuth();
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const { data: settingsData } = db.useQuery({ userSettings: {} });
  const userSettings = settingsData?.userSettings?.[0];
  const linearApiKey = userSettings?.linearApiKey ?? null;
  const linearConnected = !!linearApiKey;
  const weatherCity = userSettings?.weatherCity ?? null;

  const handleDisconnect = () => {
    if (userSettings) db.transact(db.tx.userSettings[userSettings.id].delete());
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and integrations.
        </p>
      </div>

      {/* Account */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Account
        </h2>
        <div className="bg-card rounded-2xl border-2 border-border p-5 shadow-[4px_4px_0px_0px_rgba(108,92,231,0.06)] flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center shrink-0">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              className="text-accent"
            >
              <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M3 16c0-3.314 2.686-6 6-6s6 2.686 6 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {user?.email ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground">Signed in via magic code</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => db.auth.signOut()}
          >
            Sign out
          </Button>
        </div>
      </section>

      {/* Weather */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Weather
        </h2>
        <div className="bg-card rounded-2xl border-2 border-border p-5 shadow-[4px_4px_0px_0px_rgba(108,92,231,0.06)] flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center shrink-0 text-xl">
            🌤️
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {weatherCity ?? "No city set"}
            </p>
            <p className="text-xs text-muted-foreground">
              {weatherCity ? "Your weather location" : "Set a city to see the forecast on your dashboard"}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowCityModal(true)}
          >
            {weatherCity ? "Change" : "Set City"}
          </Button>
        </div>
      </section>

      {/* Integrations */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Integrations
        </h2>
        <div className="flex flex-col gap-3">
          <IntegrationCard
            name="Linear"
            description="Sync Linear issues as tasks and stay on top of your engineering work."
            connected={linearConnected}
            onConnect={() => setShowConnectModal(true)}
            onDisconnect={handleDisconnect}
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="text-foreground"
              >
                <path
                  d="M4.379 4.379A8.5 8.5 0 0112 3.5a8.5 8.5 0 018.5 8.5 8.5 8.5 0 01-8.5 8.5A8.5 8.5 0 013.5 12c0-2.07.74-3.97 1.965-5.449L4.38 4.38zM4 12a8 8 0 008 8 8 8 0 008-8 8 8 0 00-8-8 8 8 0 00-8 8z"
                  fill="currentColor"
                />
              </svg>
            }
          />
          <IntegrationCard
            name="WhatsApp"
            description="Receive task reminders and create tasks directly from WhatsApp."
            comingSoon
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="text-green-500"
              >
                <path
                  d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
                  fill="currentColor"
                />
                <path
                  d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.975-1.418A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />
          <IntegrationCard
            name="Google Calendar"
            description="Import calendar events as tasks and sync due dates automatically."
            comingSoon
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="text-blue-500"
              >
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="18"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M16 2v4M8 2v4M3 10h18"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            }
          />
        </div>
      </section>

      {user && (
        <ConnectLinearModal
          isOpen={showConnectModal}
          onClose={() => setShowConnectModal(false)}
          userId={user.id}
          existingSettingsId={userSettings?.id}
        />
      )}
      {user && showCityModal && (
        <CityPromptModal
          isOpen={showCityModal}
          onClose={() => setShowCityModal(false)}
          userId={user.id}
          existingSettingsId={userSettings?.id}
        />
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <SettingsContent />
        </main>
      </div>
    </AuthGate>
  );
}
