"use client";

import { useEffect, useState } from "react";
import { getTodayString } from "@/lib/utils";
import { getWeatherEmoji } from "@/lib/weather";

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

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "loaded"; data: WeatherData };

function getDayLabel(dateStr: string, today: string): string {
  if (dateStr === today) return "Today";
  // Parse as local date to avoid UTC offset shifting the weekday
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

export default function WeatherStrip() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    fetch("/api/weather")
      .then((res) => {
        if (!res.ok) throw new Error("non-200");
        return res.json() as Promise<WeatherData>;
      })
      .then((data) => setState({ status: "loaded", data }))
      .catch(() => setState({ status: "error" }));
  }, []);

  if (state.status === "error") return null;

  if (state.status === "loading") {
    return (
      <div className="min-h-48 flex flex-col gap-2 animate-pulse">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-7 rounded bg-muted/40" />
        ))}
      </div>
    );
  }

  const today = getTodayString();
  const { city, daily } = state.data;

  return (
    <div className="flex flex-col gap-1 h-full">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        {city}
      </p>
      {daily.map((day) => (
        <div
          key={day.date}
          className="flex items-center justify-between text-sm"
        >
          <span className="w-12 text-muted-foreground text-xs">
            {getDayLabel(day.date, today)}
          </span>
          <span className="text-base leading-none">
            {getWeatherEmoji(day.weatherCode)}
          </span>
          <span className="tabular-nums">
            <span className="font-semibold text-foreground">{day.tempMax}°</span>
            <span className="text-muted-foreground"> / {day.tempMin}°</span>
          </span>
        </div>
      ))}
    </div>
  );
}
