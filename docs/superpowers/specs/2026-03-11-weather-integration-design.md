# Weather Integration Design

**Date:** 2026-03-11
**Feature:** 7-day local weather forecast on the dashboard
**Status:** Approved

---

## Overview

Add a 7-day weather forecast panel to the dashboard, displayed in the right half of the Daily Habits row. The Daily Habits section shrinks to the left half of that space; the WeatherStrip occupies the right half. Weather data is fetched via a Next.js API route using IP-based geolocation and the Open-Meteo API.

---

## Requirements

- Display the next 7 days of weather (today + 6 days ahead)
- Each day shows: weather emoji, day label, high temp, low temp
- Temperature in Celsius
- Location determined automatically from user's IP address (no permission prompt)
- Weather positioned in the right half of the Daily Habits row
- No API key required

---

## Architecture

### API Route — `/api/weather/route.ts`

Handles two sequential fetches server-side:

**Step 1 — IP Geolocation**
- Read client IP from `x-forwarded-for` request header (falls back to `x-real-ip`)
- Call `http://ip-api.com/json/{ip}` (free, no key, returns `city`, `lat`, `lon`)

**Step 2 — Open-Meteo Forecast**
- Call `https://api.open-meteo.com/v1/forecast` with:
  - `latitude`, `longitude` from geolocation
  - `daily=temperature_2m_max,temperature_2m_min,weathercode`
  - `timezone=auto`
  - `forecast_days=7`
  - `temperature_unit=celsius`

**Response shape:**
```ts
{
  city: string;
  daily: Array<{
    date: string;        // "YYYY-MM-DD"
    weatherCode: number; // WMO code
    tempMax: number;     // °C
    tempMin: number;     // °C
  }>;
}
```

**Caching:** `Cache-Control: public, max-age=3600` — 1 hour browser cache to avoid hammering Open-Meteo on every render.

**Error handling:** Returns `500` with `{ error: string }` if either fetch fails. The client silently hides the strip on error.

---

## WMO Weather Code Mapping — `lib/weather.ts`

Small lookup object mapping WMO codes to display emoji:

| Code(s) | Condition | Emoji |
|---------|-----------|-------|
| 0 | Clear sky | ☀️ |
| 1–3 | Partly cloudy | ⛅ |
| 45, 48 | Fog | 🌫️ |
| 51–67 | Drizzle / Rain | 🌧️ |
| 71–77 | Snow | 🌨️ |
| 80–82 | Rain showers | 🌦️ |
| 95–99 | Thunderstorm | ⛈️ |

Unknown codes fall back to `🌡️`.

---

## Component — `components/dashboard/WeatherStrip.tsx`

**Data fetching:**
- `useEffect` + `fetch('/api/weather')` on mount
- Three states: `loading`, `error`, `loaded`

**Loading state:** Skeleton placeholder (7 rows of muted bars) — matches card height.

**Error state:** Component returns `null` — strip silently absent, no error shown to user. Weather is supplementary.

**Loaded state:** Renders city name at top, then 7 day rows. Each row:
- Day label: first entry is "Today", remaining are short weekday names ("Mon", "Tue", …)
- Weather emoji
- High temp in bold
- Low temp in muted foreground

**Styling:** Matches the existing design system — monospace feel, `text-muted-foreground` for secondary values, no rounded excess. Vertically stacked rows (not horizontal cards) since the panel is in a narrow column.

---

## Layout Changes — `app/dashboard/page.tsx`

The Daily Habits row changes from a single full-width div to a two-column grid:

```
┌─────────────────────┬─────────────────────┐
│   Daily Habits      │   WeatherStrip      │
│   (accent card)     │   (standard card)   │
└─────────────────────┴─────────────────────┘
```

- Wrapper: `grid grid-cols-2 gap-5`
- Left cell: existing Daily `CategorySection` inside its `rounded-2xl border-2 border-accent/25 bg-accent-light` container — unchanged styling
- Right cell: `WeatherStrip` inside a `rounded-2xl border-2 border-border bg-card p-5 shadow` container — matches Personal/Business card style
- **Responsive:** Below `md` breakpoint, grid collapses to single column (`grid-cols-1`). Daily Habits appears first, WeatherStrip below it.

---

## Files Touched

| File | Change |
|------|--------|
| `app/api/weather/route.ts` | New — API route |
| `lib/weather.ts` | New — WMO code → emoji mapping |
| `components/dashboard/WeatherStrip.tsx` | New — weather panel component |
| `app/dashboard/page.tsx` | Modified — split Daily row into two-column grid |

---

## Out of Scope

- User-configurable location override
- Fahrenheit toggle
- Precipitation, wind, or UV data
- Refresh button (browser cache handles staleness)
- Storing weather data in InstantDB
