# Task & Reminder App — Implementation Plan

## Context

Build a centralized task/reminder web app to replace fragmented tools (notes, calendars, scattered to-do lists). Users authenticate via Instant magic codes, then manage tasks across three categories (Daily, Personal, Business) with due dates, overdue indicators, drag-and-drop reordering, and daily recurring task tracking. Desktop-first with basic mobile responsiveness. "Soft Brutalism + Linear Minimalism" design.

---

## 1. InstantDB Schema

**File:** `ai-course-project/instant.schema.ts`

**New entities:**

`tasks`:
- `title: i.string()` — task name
- `category: i.string().indexed()` — "daily" | "personal" | "business"
- `dueDate: i.number().indexed().optional()` — Unix ms timestamp
- `completed: i.boolean().indexed()` — completion state (non-daily tasks)
- `isDaily: i.boolean().indexed()` — recurring daily flag
- `sortOrder: i.number().indexed()` — drag-and-drop ordering
- `createdAt: i.number().indexed()` — creation timestamp
- `ownerId: i.string().indexed()` — auth.id of owning user

`dailyCompletions`:
- `dateString: i.string().indexed()` — "YYYY-MM-DD" local time
- `completedAt: i.number()` — timestamp when completed
- `ownerId: i.string().indexed()` — auth.id of owning user

**New links:**
- `taskOwner`: tasks → $users (has-one, cascade) / $users → tasks (has-many)
- `dailyCompletionTask`: dailyCompletions → tasks (has-one, cascade) / tasks → dailyCompletions (has-many)
- `dailyCompletionOwner`: dailyCompletions → $users (has-one, cascade) / $users → dailyCompletions (has-many)

**Daily reset mechanism:** No cron or reset logic needed. Daily tasks use `dailyCompletions` keyed by `dateString`. When the calendar day changes, `getTodayString()` returns a new date, and no completion record exists yet → task appears unchecked.

---

## 2. Permissions

**File:** `ai-course-project/instant.perms.ts`

Both entities use `auth.id == data.ownerId` for all CRUD operations — simple flat-field permission check. No `data.ref` needed since `ownerId` is stored directly on both entities.

---

## 3. File Structure

```
ai-course-project/
  lib/
    db.ts              — init({ appId, schema }) singleton
    constants.ts       — categories, accent color
    utils.ts           — getTodayString(), isOverdue(), formatDueDate()
  app/
    page.tsx           — auth gate: login or redirect to /dashboard
    layout.tsx         — root layout (fonts, metadata)
    dashboard/
      page.tsx         — main task dashboard (3 category columns)
      layout.tsx       — dashboard chrome (header, nav)
    settings/
      page.tsx         — placeholder integrations page
  components/
    auth/
      AuthGate.tsx     — shows login or children based on auth state
      LoginForm.tsx    — two-step magic code flow
    dashboard/
      CategorySection.tsx  — one category column
      TaskCard.tsx         — task row (checkbox, title, due date, overdue badge, drag handle)
      TaskList.tsx         — dnd-kit sortable wrapper
      CompletedSection.tsx — collapsible completed tasks
    tasks/
      CreateTaskModal.tsx  — modal: title, category, date picker
      TaskContextMenu.tsx  — delete/edit menu
    settings/
      IntegrationCard.tsx  — placeholder card
    ui/
      Modal.tsx, Button.tsx, Input.tsx, Badge.tsx, Card.tsx
```

---

## 4. Key Data Flows

**Dashboard query** — single `db.useQuery` call:
```ts
db.useQuery({ tasks: { dailyCompletions: { $: { where: { dateString: today } } } } })
```
Permissions auto-filter to current user's tasks. Daily task "done today" = `task.dailyCompletions.length > 0`.

**Task sorting (client-side):**
1. Overdue tasks float to top (dueDate < now, not completed, not daily)
2. Within groups, sort by `sortOrder` ascending

**Drag-and-drop reorder:**
- Library: `@dnd-kit/core` + `@dnd-kit/sortable`
- On drop: compute new `sortOrder` as midpoint between neighbors (gaps of 1000)
- Single transact to update the moved task's `sortOrder`

**Completed tasks:** Non-daily completed tasks sink to a collapsed "Completed" section at bottom of each category.

---

## 5. Design System — Soft Brutalism + Linear Minimalism

- **Accent:** `#6C5CE7` (vivid purple)
- **Overdue:** `#EF4444` (red)
- **Cards:** `rounded-2xl border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]` — offset shadow is the brutalism touch
- **Buttons:** `rounded-xl border-2 font-semibold` — primary = accent bg, secondary = transparent + border
- **Checkbox:** Custom 24px rounded-lg, accent fill on check
- **Typography:** Geist Sans (already configured), bold uppercase category headers
- **Layout:** `max-w-7xl`, 3-column grid on desktop, single column on mobile
- **Theme:** Define `--color-accent` and other tokens in `globals.css` `@theme` block (Tailwind v4)

---

## 6. Implementation Phases

### Phase 1: Foundation
- Create `lib/db.ts`, `lib/constants.ts`, `lib/utils.ts`
- Update `instant.schema.ts` with tasks + dailyCompletions
- Update `instant.perms.ts` with permission rules
- Push schema + perms via `npx instant-cli push schema --yes` and `npx instant-cli push perms --yes`

### Phase 2: Auth
- Build base UI primitives (`Button`, `Input`, `Card`)
- Build `LoginForm.tsx` (magic code two-step)
- Build `AuthGate.tsx`
- Update `app/page.tsx` as auth entry point

### Phase 3: Dashboard Shell
- Create `app/dashboard/layout.tsx` (header, nav, AuthGate wrapper)
- Create `app/dashboard/page.tsx` (main query, 3-column layout)
- Build `CategorySection.tsx` and `TaskCard.tsx` with checkbox toggle

### Phase 4: Task CRUD
- Build `Modal.tsx` and `CreateTaskModal.tsx` with floating "+" button
- Build `TaskContextMenu.tsx` with delete
- Implement inline title editing (click to edit)
- Implement daily task completion (create/delete dailyCompletions)

### Phase 5: Drag-and-Drop
- Install `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- Build `TaskList.tsx` with sortable context
- Implement sortOrder recalculation on drag end

### Phase 6: Completed & Overdue
- Build `CompletedSection.tsx` (collapsible)
- Implement client-side overdue sorting
- Add overdue badge styling

### Phase 7: Settings
- Create `app/settings/page.tsx`
- Build `IntegrationCard.tsx` placeholders (Linear, WhatsApp)
- Account section with email + sign out

### Phase 8: Polish
- Responsive breakpoints (stacked mobile, 3-col desktop)
- Transitions/animations (modal, completion, drag)
- Dark mode support
- Loading states and empty states
- Update metadata in layout.tsx

---

## 9. Phase 2 Enhancements

### 9.1 Calendar Date Picker

Replaced the native `<input type="date">` with a custom `components/ui/DatePicker.tsx` component built on **react-day-picker v9**.

- Trigger button styled to match the existing Input component (border-2, rounded-xl, accent focus ring)
- Calendar popover opens below the trigger, themed with design system colours (`bg-card`, `border-border`, accent for selected day)
- Click-outside closes the popover; a clear (×) button on the trigger removes the selected date
- Used in both `CreateTaskModal` and `TaskDetailModal`
- `label` prop typed as `React.ReactNode` to allow mixed text/span content

### 9.2 Task Description Field

Added `description: i.string().optional()` to the `tasks` entity in `instant.schema.ts` (schema pushed, no index needed).

- `CreateTaskModal` — optional textarea below the title field
- `TaskDetailModal` — optional textarea, pre-filled with existing value
- `TaskCard` — if a description exists, it renders as a truncated subtitle line beneath the task title

### 9.3 Task Detail Modal

New `components/tasks/TaskDetailModal.tsx` opens when clicking anywhere on a task card (excluding the checkbox and `...` context menu).

- Replaces the previous inline title editing on click
- Editable fields: title, description, category, due date (DatePicker), completion status indicator
- Delete button (danger style) in the footer
- Single `db.transact(db.tx.tasks[id].update({...}))` on save
- `TaskCard` checkbox uses `e.stopPropagation()` so toggling completion does not open the modal

### 9.4 Completed Section Always Visible

Removed the collapse/expand toggle from `CompletedSection.tsx`.

- Completed tasks are always rendered as a visible sub-section within each category column
- Static "COMPLETED" label with count badge and a divider line replace the toggle button
- Tasks retain the `opacity-60` visual treatment

---

## 10. Phase 3 — Dashboard Layout Redesign

Replaced the 3-equal-column grid with a full-width stacked layout ("Option A"). Goals: (1) Daily tasks get a distinct visual identity, (2) Personal/Business tasks get maximum horizontal width so titles never truncate.

### 10.1 Layout Structure

`app/dashboard/page.tsx` changed from a CSS grid to a vertical `flex-col gap-5` stack:

```
┌──────────────────────────────────────────────────────────┐
│  ☀  DAILY HABITS           [purple accent bg strip]      │
│  ○ Morning workout                                        │
│  ○ Read 20 mins                                           │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│  👤  PERSONAL                                        [+] │
│  ○  Book dentist appointment                    Today    │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│  💼  BUSINESS                                        [+] │
│  ○  Finalise Q2 OKR deck for Thursday all-hands  Overdue │
└──────────────────────────────────────────────────────────┘
```

- **Daily card:** `bg-accent-light` with `border-accent/25` and purple shadow. Heading reads "Daily Habits". Progress pill (e.g. "3/5") shown next to heading.
- **Personal / Business cards:** `bg-card` with `border-border` and subtle shadow. Full viewport width — long titles are never truncated.

### 10.2 Variant Prop System

`CategorySection.tsx` accepts `variant?: "daily" | "standard"` and `progressLabel?: string`:

- `variant="daily"` → accent-tinted divider, "Daily Habits" heading, progress pill, daily-style empty state
- `variant="standard"` → default border divider, category label from `CATEGORY_LABELS`

### 10.3 dailyVariant Threading

A `dailyVariant?: boolean` prop is threaded through the component tree so task rows render differently inside the Daily card:

| Component | Daily variant behaviour |
|---|---|
| `TaskCard` / `TaskCardContent` | `bg-white/50 border-accent/20`, tighter `py-2` padding, `font-medium` title, accent-tinted drag handle, no due-date badges, completed items `opacity-60` |
| `TaskList` | Passes `dailyVariant` to each `TaskCard` and to `DragOverlay` |
| `CompletedSection` | Passes `dailyVariant` to each `TaskCardContent` |

### 10.4 Files Changed

| File | Change |
|---|---|
| `app/dashboard/page.tsx` | Full-width stack; Daily gets accent card, Personal/Business get standard cards |
| `components/dashboard/CategorySection.tsx` | `variant` + `progressLabel` props; conditional heading/styles |
| `components/dashboard/TaskCard.tsx` | `dailyVariant` prop with distinct row styling |
| `components/dashboard/TaskList.tsx` | `dailyVariant` prop threading |
| `components/dashboard/CompletedSection.tsx` | `dailyVariant` prop threading |

No schema or InstantDB changes required.

---

## 11. Task Priority + Per-Section Sort (Phase 4)

### 11.1 Overview

Adds an optional priority level to each task and lets users sort each section independently by manual order, priority, or due date.

### 11.2 Schema Change

Added to the `tasks` entity in `instant.schema.ts`:

```typescript
priority: i.number().indexed().optional(),
```

Priority encoding: `1` = High, `2` = Medium, `3` = Low, `undefined` = None. Integer values make ascending sort work naturally (High surfaces first).

Schema pushed via `npx instant-cli push schema --yes`.

### 11.3 Constants

Added to `lib/constants.ts`:

```typescript
export const PRIORITY_OPTIONS = [
  { value: 1, label: "High",   dot: "bg-red-500"   },
  { value: 2, label: "Medium", dot: "bg-amber-400" },
  { value: 3, label: "Low",    dot: "bg-blue-400"  },
] as const;

export type Priority = 1 | 2 | 3;
export type SortMode = "manual" | "priority" | "dueDate";
```

### 11.4 Component Changes

| Component | Change |
|---|---|
| `TaskCard` | Coloured dot (`w-2 h-2 rounded-full`) between drag handle and checkbox; red/amber/blue for High/Medium/Low; hidden when `priority` is undefined |
| `CreateTaskModal` | Priority picker (None / High / Medium / Low pill buttons with coloured dots) above the category picker; persisted in `db.tx.tasks[id].create({ priority })` |
| `TaskDetailModal` | Same priority picker pre-populated from `task.priority`; saved in `db.tx.tasks[id].update({ priority })` |
| `CategorySection` | `sortMode` state (default `"manual"`), `sortOpen` dropdown state, click-outside `useEffect`; sort icon button left of [+]; active sort tints icon accent |

### 11.5 Sort Logic (CategorySection `useMemo`)

| Sort mode | Behaviour |
|---|---|
| `manual` | Overdue tasks first, then ascending `sortOrder` (original behaviour) |
| `priority` | Ascending `priority` (1→2→3→undefined treated as 99); tiebreak by `sortOrder` |
| `dueDate` | Ascending `dueDate`; tasks with no due date sink to bottom (`Infinity`); tiebreak by `sortOrder` |

### 11.6 Files Changed

| File | Change |
|---|---|
| `instant.schema.ts` | Added `priority` field |
| `lib/constants.ts` | Added `PRIORITY_OPTIONS`, `Priority`, `SortMode` |
| `components/dashboard/TaskCard.tsx` | Priority dot indicator |
| `components/tasks/CreateTaskModal.tsx` | Priority picker UI + persistence |
| `components/tasks/TaskDetailModal.tsx` | Priority picker UI + persistence |
| `components/dashboard/CategorySection.tsx` | Sort state, dropdown UI, updated sort logic |

---

## 12. Weather Integration (Phase 5)

### 12.1 Overview

Adds a 7-day local weather forecast panel to the dashboard, occupying the right half of the Daily Habits row. Location is determined automatically from the user's IP address — no permission prompt required.

### 12.2 Architecture

Two sequential server-side fetches inside a Next.js API route:

1. **IP geolocation** via `ipapi.co/{ip}/json/` (free, no API key)
   - IP read from `x-forwarded-for` (first value) or `x-real-ip` headers
   - Loopback addresses (`127.0.0.1`, `::1`) fall back to London for local dev
2. **7-day forecast** via `https://api.open-meteo.com/v1/forecast` (free, no API key)
   - Params: `latitude`, `longitude`, `daily=temperature_2m_max,temperature_2m_min,weathercode`, `timezone=auto`, `forecast_days=7`, `temperature_unit=celsius`

Response shape: `{ city: string, daily: Array<{ date, weatherCode, tempMax, tempMin }> }` with `Cache-Control: private, max-age=3600`.

### 12.3 WMO Code → Emoji Mapping (`lib/weather.ts`)

| Code(s) | Condition | Emoji |
|---------|-----------|-------|
| 0 | Clear sky | ☀️ |
| 1–3 | Partly cloudy | ⛅ |
| 45, 48 | Fog | 🌫️ |
| 51–67 | Drizzle / Rain | 🌧️ |
| 71–77 | Snow | 🌨️ |
| 80–86 | Rain/snow showers | 🌦️ |
| 95–99 | Thunderstorm | ⛈️ |
| Other | Fallback | 🌡️ |

### 12.4 Layout Change

Daily Habits row split from full-width into a responsive two-column grid:
```
┌─────────────────────┬─────────────────────┐
│   Daily Habits      │  Weather Forecast   │
│   (accent card)     │  (standard card)    │
└─────────────────────┴─────────────────────┘
```
- Wrapper: `grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch`
- Below `md` breakpoint: single column, Daily Habits first

### 12.5 Files Changed

| File | Change |
|------|--------|
| `lib/weather.ts` | New — WMO code → emoji mapping |
| `app/api/weather/route.ts` | New — Next.js GET handler (IP geo → Open-Meteo → `{ city, daily }`) |
| `components/dashboard/WeatherStrip.tsx` | New — client component (loading skeleton, 7-day rows, header "Weather Forecast (City)") |
| `app/dashboard/page.tsx` | Modified — Daily row becomes responsive two-column grid |

---

## 13. Linear Integration (Phase 6)

### 13.1 Overview

Reads Linear issues assigned to the user and displays them as a read-only sub-section inside the Business card, positioned between the active task list and the Completed section. Uses a personal API key — no OAuth required.

### 13.2 Architecture

- `LINEAR_PERSONAL_API_KEY` stored server-side in `.env`
- `/api/linear` GET route POSTs to `https://api.linear.app/graphql` using the key as the `Authorization` header (no "Bearer" prefix for personal keys)
- GraphQL query filters out completed/cancelled states server-side via `state: { type: { nin: ["completed", "cancelled"] } }`
- Route returns `{ connected: boolean, issues: LinearIssue[] }` (always 200; key absent → `connected: false`)
- `Cache-Control: private, max-age=300` (5-minute browser cache)

### 13.3 `LinearIssue` Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Linear issue ID |
| `title` | `string` | Issue title |
| `priority` | `number` | 0=none 1=urgent 2=high 3=medium 4=low |
| `url` | `string` | Direct link to issue in Linear |
| `dueDate` | `string \| null` | "YYYY-MM-DD" or null |
| `state` | `{ name, type }` | Workflow state |
| `team` | `{ name }` | Team the issue belongs to |

### 13.4 LinearSection Component

Client component (`"use client"`). Self-fetches `/api/linear` on mount. Renders `null` while loading or when there are no issues. Once loaded with ≥1 issue, renders:

- **Header:** Linear triangle logo icon + "LINEAR" label + count badge — mirrors CompletedSection pattern
- **Divider:** `h-px bg-border`
- **Issue rows:** each is an `<a target="_blank">` with:
  - Priority dot: red (urgent/high), amber (medium), blue (low), hidden (none)
  - Truncated title
  - Team name badge + state name badge
  - Due date (via `dateStringToTimestamp` + `formatDueDate` from `lib/utils`); overdue dates use `text-overdue`
  - External link ↗ icon visible on hover

### 13.5 Settings Page Integration

The Linear `IntegrationCard` transitions from "Coming soon" to a three-state action:

| State | Condition | UI |
|-------|-----------|-----|
| Coming soon | `comingSoon` prop | Disabled "Coming soon" button |
| Connect | `connected === false` | Active "Connect" button (accent border) |
| Connected | `connected === true` | Green dot + "Connected" badge; card border turns `border-green-200` |

`app/settings/page.tsx` fetches `/api/linear` on mount to detect `connected` state and passes it to the Linear card.

### 13.6 Files Changed

| File | Change |
|------|--------|
| `lib/linear.ts` | New — `LinearIssue`, `LinearApiResponse` types + `LINEAR_ASSIGNED_QUERY` constant |
| `app/api/linear/route.ts` | New — server-side GET handler |
| `components/dashboard/LinearSection.tsx` | New — read-only issue sub-section component |
| `components/dashboard/CategorySection.tsx` | Modified — `<LinearSection />` injected when `category === "business"` in both empty-state and active branches |
| `components/settings/IntegrationCard.tsx` | Modified — added `connected?: boolean` prop with three-state button logic |
| `app/settings/page.tsx` | Modified — fetches `/api/linear` and passes `connected` to Linear card; `comingSoon` removed from Linear card |
| `.env` | Modified — placeholder `LINEAR_PERSONAL_API_KEY=` line added |

### 13.7 Setup

1. Go to Linear → Settings → API → Personal API keys → Create key
2. Add to `.env`: `LINEAR_PERSONAL_API_KEY=lin_api_xxxxxxxxxxxxxxxxxxxxxxxx`
3. Restart dev server — Business section shows assigned issues; Settings shows "Connected"

---

## 7. Verification

1. **Schema:** `npx instant-cli push schema --yes` succeeds without errors
2. **Type check:** `npx tsc --noEmit` passes
3. **Lint:** `npm run lint` passes
4. **Auth flow:** Login with email → receive magic code → enter code → lands on dashboard
5. **Task CRUD:** Create task via modal → appears in correct category → edit title inline → delete via context menu
6. **Daily tasks:** Check off daily task → refresh page → still checked → wait until next day (or change system clock) → unchecked
7. **Drag-and-drop:** Reorder tasks → refresh → order persists
8. **Overdue:** Create task with past due date → appears at top with red badge
9. **Completed:** Check non-daily task → moves to collapsed "Completed" section
10. **Data isolation:** Log in as different user → see no tasks from first user
11. **Build:** `npm run build` completes without errors
