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

### API Route — `app/api/weather/route.ts`

A Next.js App Router route handler (`GET`) — resolves to the URL `/api/weather`. Handles two sequential fetches server-side. Deployment target is Vercel (standard Next.js hosting).

**Step 1 — IP Geolocation**
- Read client IP from `x-forwarded-for` request header (falls back to `x-real-ip`). If the header contains a comma-separated list (e.g. `"203.0.113.1, 10.0.0.1"`) take only the **first** IP.
- If IP is a loopback address (`127.0.0.1` or `::1`) — i.e., local development — skip geolocation and use a hardcoded fallback: `{ city: "London", lat: 51.5074, lon: -0.1278 }`.
- Otherwise call `https://ipapi.co/{ip}/json/` with `{ cache: 'no-store' }` (free tier, HTTPS, no API key required).
  - The response includes `city`, `latitude`, `longitude` fields when successful.
  - On rate-limit, `ipapi.co` returns HTTP 200 with `{ "error": true, "reason": "..." }`. The route must check for `json.error === true` and treat it as a failure → return `500`.

**Step 2 — Open-Meteo Forecast**
- Call `https://api.open-meteo.com/v1/forecast` with `{ cache: 'no-store' }` and params:
  - `latitude`, `longitude` from geolocation
  - `daily=temperature_2m_max,temperature_2m_min,weathercode`
  - `timezone=auto`
  - `forecast_days=7`
  - `temperature_unit=celsius`
- Both internal fetches use `{ cache: 'no-store' }` to bypass Next.js's framework-level fetch cache — freshness is controlled solely by the browser `Cache-Control` response header.
- If Open-Meteo returns fewer than 7 daily entries, the component renders only the entries present (no crash on short arrays).

**Response shape:**
```ts
{
  city: string;
  daily: Array<{
    date: string;        // "YYYY-MM-DD"
    weatherCode: number; // WMO code
    tempMax: number;     // °C
    tempMin: number;     // °C
  }>;  // length 1–7
}
```

**Caching:** Set response header `Cache-Control: private, max-age=3600` — 1 hour private browser cache. `private` prevents shared CDN/edge caches from serving one user's city to another.

**Error handling:** Returns `500` with `{ error: string }` if either fetch fails or `ipapi.co` reports an error. The client silently hides the strip on any non-200 response.

---

## WMO Weather Code Mapping — `lib/weather.ts`

Small lookup object mapping WMO codes to display emoji. Codes 68–70 (freezing drizzle / intermittent snowfall) are intentionally omitted — they fall through to the `🌡️` fallback, which is acceptable for a supplementary display.

| Code(s) | Condition | Emoji |
|---------|-----------|-------|
| 0 | Clear sky | ☀️ |
| 1–3 | Partly cloudy | ⛅ |
| 45, 48 | Fog | 🌫️ |
| 51–67 | Drizzle / Rain | 🌧️ |
| 71–77 | Snow | 🌨️ |
| 80–86 | Rain/snow showers | 🌦️ |
| 95–99 | Thunderstorm | ⛈️ |

Unknown/unlisted codes fall back to `🌡️`.

---

## Component — `components/dashboard/WeatherStrip.tsx`

**Data fetching:**
- `useEffect` + `fetch('/api/weather')` on mount
- Three states: `loading`, `error`, `loaded`

**Loading state:** Skeleton placeholder (7 rows of muted bars) using `min-h-48` for a consistent presence regardless of Daily Habits task count.

**Error state:** Component returns `null` — strip silently absent, no error shown to user. Weather is supplementary.

**Loaded state:** Renders city name at top, then up to 7 day rows (renders only entries returned by the API). Each row:
- Day label: compare `daily[i].date` against the browser's today string via `getTodayString()` from `lib/utils.ts`. If they match → "Today"; otherwise derive the short weekday name ("Mon", "Tue", …) from the date string. Note: if the user's browser timezone differs from their IP-geolocated timezone (e.g. VPN, traveler), the "Today" label may be off by one day — this is acceptable given the supplementary nature of the feature.
- Weather emoji (from WMO mapping)
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

- Wrapper: `grid grid-cols-2 gap-5 items-stretch`
- Left cell: existing Daily `CategorySection` inside its `rounded-2xl border-2 border-accent/25 bg-accent-light` container — unchanged styling, adds `h-full` to stretch within grid row
- Right cell: `WeatherStrip` inside a `rounded-2xl border-2 border-border bg-card p-5 shadow h-full` container. `h-full` gives the skeleton's `min-h-48` a reliable reference and ensures the card fills the row height.
- **Responsive:** Below `md` breakpoint, grid collapses to single column (`grid-cols-1`). Daily Habits appears first, WeatherStrip below it.

---

## Files Touched

| File | Change |
|------|--------|
| `app/api/weather/route.ts` | New — Next.js App Router GET handler (URL: `/api/weather`) |
| `lib/weather.ts` | New — WMO code → emoji mapping utility |
| `components/dashboard/WeatherStrip.tsx` | New — weather panel component |
| `app/dashboard/page.tsx` | Modified — split Daily row into two-column grid |

---

## Out of Scope

- User-configurable location override
- Fahrenheit toggle
- Precipitation, wind, or UV data
- Refresh button (browser cache handles staleness)
- Storing weather data in InstantDB
