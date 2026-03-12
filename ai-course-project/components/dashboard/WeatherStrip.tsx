"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { getTodayString } from "@/lib/utils";
import { getWeatherEmoji } from "@/lib/weather";
import CityPromptModal from "./CityPromptModal";

interface WeatherDay {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
}

interface WeatherData {
  city: string;
  daily: WeatherDay[];
}

type Status = "loading" | "no_city" | "error" | "done";

function getDayLabel(dateStr: string, today: string): string {
  if (dateStr === today) return "Today";
  // Parse as local date to avoid UTC offset shifting the weekday
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

export default function WeatherStrip() {
  const { user } = db.useAuth();
  const { data: settingsData } = db.useQuery({ userSettings: {} });
  const settingsRecord = settingsData?.userSettings?.[0];
  const weatherCity = settingsRecord?.weatherCity ?? null;

  const [status, setStatus] = useState<Status>("loading");
  const [forecast, setForecast] = useState<WeatherData | null>(null);
  const [showCityModal, setShowCityModal] = useState(false);

  useEffect(() => {
    if (!weatherCity) {
      setStatus("no_city");
      return;
    }
    setStatus("loading");
    fetch(`/api/weather?city=${encodeURIComponent(weatherCity)}`)
      .then((res) => res.json() as Promise<WeatherData & { error?: string }>)
      .then((data) => {
        if (data.error) {
          setStatus("error");
          return;
        }
        setForecast(data);
        setStatus("done");
      })
      .catch(() => setStatus("error"));
  }, [weatherCity]);

  if (status === "no_city") {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
          <span className="text-4xl">🌤️</span>
          <p className="text-sm text-muted-foreground text-center">
            Set your city to see the<br />local weather forecast
          </p>
          <button
            onClick={() => setShowCityModal(true)}
            className="px-4 py-2 rounded-xl border-2 border-border text-sm font-semibold hover:border-accent/60 transition-all"
          >
            Set City
          </button>
        </div>
        {user && showCityModal && (
          <CityPromptModal
            isOpen={showCityModal}
            onClose={() => setShowCityModal(false)}
            userId={user.id}
            existingSettingsId={settingsRecord?.id}
          />
        )}
      </>
    );
  }

  if (status === "error") return null;

  if (status === "loading" || !forecast) {
    return (
      <div className="min-h-48 flex flex-col gap-2 animate-pulse">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-7 rounded bg-muted/40" />
        ))}
      </div>
    );
  }

  const today = getTodayString();
  const { city, daily } = forecast;

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-1.5 mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Weather Forecast ({city})
          </p>
          <button
            onClick={() => setShowCityModal(true)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Change city"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col flex-1 justify-between">
          {daily.map((day) => (
            <div
              key={day.date}
              className="flex items-center justify-between flex-1"
            >
              <span className="w-12 text-muted-foreground text-xs">
                {getDayLabel(day.date, today)}
              </span>
              <span className="text-3xl leading-none">
                {getWeatherEmoji(day.weatherCode)}
              </span>
              <span className="tabular-nums text-sm">
                <span className="font-semibold text-foreground">{day.tempMax}°</span>
                <span className="text-muted-foreground"> / {day.tempMin}°</span>
              </span>
            </div>
          ))}
        </div>
      </div>
      {user && showCityModal && (
        <CityPromptModal
          isOpen={showCityModal}
          onClose={() => setShowCityModal(false)}
          userId={user.id}
          existingSettingsId={settingsRecord?.id}
        />
      )}
    </>
  );
}
