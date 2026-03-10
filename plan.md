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
