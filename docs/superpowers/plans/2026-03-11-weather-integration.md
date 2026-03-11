# Weather Integration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 7-day weather forecast panel (emoji + high/low °C per day) to the dashboard, displayed in the right half of the Daily Habits row, powered by IP geolocation and Open-Meteo.

**Architecture:** A Next.js App Router API route (`/api/weather`) performs IP geolocation via `ipapi.co` then fetches Open-Meteo forecast data, returning a typed JSON response. A `WeatherStrip` React component fetches that route on mount and renders the forecast. The dashboard page splits the Daily Habits row into a two-column grid to host the new panel.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, TypeScript. No new dependencies required.

---

## Chunk 1: WMO utility and API route

### Task 1: WMO weather code → emoji mapping utility

**Files:**
- Create: `ai-course-project/lib/weather.ts`

- [ ] **Step 1: Create `lib/weather.ts` with the WMO map and helper**

```ts
// ai-course-project/lib/weather.ts

const WMO_MAP: Record<number, string> = {
  0: "☀️",
  1: "⛅", 2: "⛅", 3: "⛅",
  45: "🌫️", 48: "🌫️",
  51: "🌧️", 53: "🌧️", 55: "🌧️",
  56: "🌧️", 57: "🌧️",
  61: "🌧️", 63: "🌧️", 65: "🌧️",
  66: "🌧️", 67: "🌧️",
  71: "🌨️", 73: "🌨️", 75: "🌨️",
  77: "🌨️",
  80: "🌦️", 81: "🌦️", 82: "🌦️",
  83: "🌦️", 84: "🌦️", 85: "🌦️", 86: "🌦️",
  95: "⛈️", 96: "⛈️", 99: "⛈️",
};

export function getWeatherEmoji(code: number): string {
  return WMO_MAP[code] ?? "🌡️";
}
```

- [ ] **Step 2: Verify TypeScript is happy**

Run from `ai-course-project/`:
```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add ai-course-project/lib/weather.ts
git commit -m "feat: add WMO weather code → emoji utility"
```

---

### Task 2: Weather API route

**Files:**
- Create: `ai-course-project/app/api/weather/route.ts`

- [ ] **Step 1: Create the route file**

```ts
// ai-course-project/app/api/weather/route.ts
import { NextRequest, NextResponse } from "next/server";

interface WeatherDay {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
}

interface WeatherResponse {
  city: string;
  daily: WeatherDay[];
}

interface IpapiResponse {
  city: string;
  latitude: number;
  longitude: number;
  error?: boolean;
  reason?: string;
}

interface OpenMeteoResponse {
  daily: {
    time: string[];
    weathercode: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}

const LOOPBACK = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
const DEV_FALLBACK = { city: "London", latitude: 51.5074, longitude: -0.1278 };

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Step 1: resolve IP
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const rawIp = forwarded ? forwarded.split(",")[0].trim() : (realIp ?? "");
    const ip = rawIp.trim();

    // Step 2: geolocate
    let city: string;
    let latitude: number;
    let longitude: number;

    if (!ip || LOOPBACK.has(ip)) {
      ({ city, latitude, longitude } = DEV_FALLBACK);
    } else {
      const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, {
        cache: "no-store",
      });
      if (!geoRes.ok) {
        return NextResponse.json({ error: "Geolocation failed" }, { status: 500 });
      }
      const geo = (await geoRes.json()) as IpapiResponse;
      if (geo.error) {
        return NextResponse.json(
          { error: geo.reason ?? "Geolocation error" },
          { status: 500 }
        );
      }
      city = geo.city;
      latitude = geo.latitude;
      longitude = geo.longitude;
    }

    // Step 3: fetch forecast
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      daily: "temperature_2m_max,temperature_2m_min,weathercode",
      timezone: "auto",
      forecast_days: "7",
      temperature_unit: "celsius",
    });
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params}`,
      { cache: "no-store" }
    );
    if (!weatherRes.ok) {
      return NextResponse.json({ error: "Weather fetch failed" }, { status: 500 });
    }
    const weather = (await weatherRes.json()) as OpenMeteoResponse;

    // Step 4: shape response
    const daily: WeatherDay[] = weather.daily.time.map((date, i) => ({
      date,
      weatherCode: weather.daily.weathercode[i],
      tempMax: Math.round(weather.daily.temperature_2m_max[i]),
      tempMin: Math.round(weather.daily.temperature_2m_min[i]),
    }));

    const body: WeatherResponse = { city, daily };
    return NextResponse.json(body, {
      headers: { "Cache-Control": "private, max-age=3600" },
    });
  } catch {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify TypeScript**

Run from `ai-course-project/`:
```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Smoke-test the route manually**

Start the dev server (`npm run dev`) and visit `http://localhost:3000/api/weather` in the browser.

Expected: JSON response with `city` (should be "London" in local dev) and `daily` array of 7 entries, each with `date`, `weatherCode`, `tempMax`, `tempMin`.

- [ ] **Step 4: Commit**

```bash
git add ai-course-project/app/api/weather/route.ts
git commit -m "feat: add /api/weather route with IP geolocation + Open-Meteo"
```

---

## Chunk 2: WeatherStrip component and dashboard layout

> **Prerequisite:** Chunk 1 must be complete. `lib/weather.ts` and `app/api/weather/route.ts` must exist before starting this chunk.

### Task 3: WeatherStrip component

**Files:**
- Create: `ai-course-project/components/dashboard/WeatherStrip.tsx`

- [ ] **Step 1: Create the component**

```tsx
// ai-course-project/components/dashboard/WeatherStrip.tsx
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
```

- [ ] **Step 2: Verify TypeScript**

Run from `ai-course-project/`:
```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add ai-course-project/components/dashboard/WeatherStrip.tsx
git commit -m "feat: add WeatherStrip component"
```

---

### Task 4: Wire WeatherStrip into the dashboard layout

**Files:**
- Modify: `ai-course-project/app/dashboard/page.tsx`

- [ ] **Step 1: Add the WeatherStrip import to `page.tsx`**

After the last existing import in the file (currently `import CategorySection from "@/components/dashboard/CategorySection";`), add:

```ts
import WeatherStrip from "@/components/dashboard/WeatherStrip";
```

- [ ] **Step 2: Replace the DAILY section div with a two-column grid**

Replace this block (lines 87–97):

```tsx
      {/* ── DAILY — full-width accent strip ── */}
      <div className="rounded-2xl border-2 border-accent/25 bg-accent-light p-5 shadow-[4px_4px_0px_0px_rgba(108,92,231,0.12)]">
        <CategorySection
          category="daily"
          variant="daily"
          tasks={tasksByCategory.daily}
          today={today}
          userId={user.id}
          progressLabel={dailyTotal > 0 ? `${dailyDone}/${dailyTotal}` : undefined}
        />
      </div>
```

With:

```tsx
      {/* ── DAILY + WEATHER — two-column row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
        {/* Left: Daily Habits */}
        <div className="rounded-2xl border-2 border-accent/25 bg-accent-light p-5 shadow-[4px_4px_0px_0px_rgba(108,92,231,0.12)] h-full">
          <CategorySection
            category="daily"
            variant="daily"
            tasks={tasksByCategory.daily}
            today={today}
            userId={user.id}
            progressLabel={dailyTotal > 0 ? `${dailyDone}/${dailyTotal}` : undefined}
          />
        </div>
        {/* Right: Weather */}
        <div className="rounded-2xl border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(108,92,231,0.06)] h-full">
          <WeatherStrip />
        </div>
      </div>
```

- [ ] **Step 3: Verify TypeScript**

Run from `ai-course-project/`:
```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Visual check in the browser**

Start dev server (`npm run dev`), open `http://localhost:3000/dashboard`.

Check:
- Daily Habits and WeatherStrip sit side-by-side on desktop (≥ md breakpoint)
- WeatherStrip shows city name + up to 7 rows of day/emoji/temp (first row labelled "Today")
- On a narrow viewport (< md), they stack vertically — Daily Habits on top, Weather below
- Skeleton animates while weather loads

- [ ] **Step 5: Production build check**

Run from `ai-course-project/`:
```bash
npm run build
```
Expected: build completes with no errors.

- [ ] **Step 6: Commit**

```bash
git add ai-course-project/app/dashboard/page.tsx
git commit -m "feat: integrate WeatherStrip into dashboard — split Daily row into two-column grid"
```
