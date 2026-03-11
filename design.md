# design.md

Design system documentation and decisions log for TaskFlow.

---

## Part 1 — Design System

### 1.1 Color Tokens

All colors are defined as CSS custom properties in `app/globals.css` and mapped into Tailwind v4 via the `@theme inline` block. This means every token is available as a Tailwind utility (e.g. `bg-accent`, `text-muted-foreground`).

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--background` | `#f7f6ff` | `#0e0d1f` | Page background |
| `--foreground` | `#1a1a2e` | `#f1f0ff` | Primary text |
| `--card` | `#ffffff` | `#171628` | Card / surface background |
| `--border` | `#ddd9f5` | `#2a2845` | Borders, dividers |
| `--accent` | `#6c5ce7` | `#7c6ff7` | Primary brand color, interactive highlights |
| `--accent-light` | `#ede9ff` | `#1e1b3a` | Accent tinted backgrounds (Daily card, nav active state) |
| `--accent-foreground` | `#ffffff` | `#ffffff` | Text on accent-colored backgrounds |
| `--overdue` | `#ef4444` | `#f87171` | Overdue task indicators, danger actions |
| `--overdue-light` | `#fef2f2` | `#2a1515` | Background tint for overdue tasks |
| `--muted` | `#f0eff9` | `#141325` | Subtle backgrounds (ghost hover, muted badges) |
| `--muted-foreground` | `#6b7280` | `#9ca3af` | Secondary / placeholder text |
| `--success` | `#10b981` | `#34d399` | Reserved for success states |

Dark mode is applied automatically via `prefers-color-scheme: dark` — no class toggle required.

### 1.2 Typography

- **Font family:** Geist Sans (`--font-geist-sans`) for UI, Geist Mono (`--font-geist-mono`) for code. Both loaded via `next/font/google` in `app/layout.tsx`.
- **Base size:** `text-sm` (14px) for most UI text.
- **Headings:** `text-xs font-bold uppercase tracking-widest` for section labels (category headers). `text-2xl font-bold` for the dashboard page title.
- **Labels:** `text-sm font-semibold` for form labels and modal headings.
- **Secondary text:** `text-xs text-muted-foreground` for descriptions, timestamps, and helper copy.

### 1.3 Spacing & Sizing

- **Border radius:** `rounded-xl` (12px) for interactive elements (buttons, inputs, task rows, badges). `rounded-2xl` (16px) for cards and modals.
- **Border width:** `border-2` (2px) throughout — gives a consistent hand-drawn/neo-brutalist feel.
- **Card padding:** `p-5` (20px) for dashboard section cards.
- **Gap scale:** `gap-1.5` between task rows, `gap-3` within task row items, `gap-5` between dashboard sections.

### 1.4 Shadows

A consistent offset shadow system is used to give depth without blur. All shadows use the accent color at low opacity:

| Usage | Shadow value |
|---|---|
| Dashboard section cards (standard) | `shadow-[4px_4px_0px_0px_rgba(108,92,231,0.06)]` |
| Daily habits card | `shadow-[4px_4px_0px_0px_rgba(108,92,231,0.12)]` |
| Task row (standard, hover) | `shadow-[3px_3px_0px_0px_rgba(0,0,0,0.04)]` → `shadow-[3px_3px_0px_0px_rgba(108,92,231,0.08)]` |
| Task row (daily variant) | `shadow-[2px_2px_0px_0px_rgba(108,92,231,0.08)]` |
| Modal | `shadow-[8px_8px_0px_0px_rgba(108,92,231,0.15)]` |
| Calendar popover | `shadow-[6px_6px_0px_0px_rgba(108,92,231,0.12)]` |
| Brand logo mark | `shadow-[2px_2px_0px_0px_rgba(108,92,231,0.4)]` |

### 1.5 UI Components

#### Button (`components/ui/Button.tsx`)

Four variants × three sizes. All use `rounded-xl border-2 font-semibold`.

| Variant | Style |
|---|---|
| `primary` | `bg-accent text-white border-accent hover:opacity-90` |
| `secondary` | Transparent with `border-border`, accent on hover |
| `ghost` | Transparent, muted text, `bg-muted` background on hover |
| `danger` | Transparent with `border-overdue text-overdue`, fills red on hover |

| Size | Classes |
|---|---|
| `sm` | `px-3 py-1.5 text-xs` |
| `md` | `px-4 py-2 text-sm` (default) |
| `lg` | `px-6 py-3 text-base` |

#### Input (`components/ui/Input.tsx`)

- `rounded-xl border-2 border-border bg-card`
- Focus: `border-accent ring-2 ring-accent/20`
- Error state: `border-overdue ring-overdue/20`
- Optional `label` (renders `<label>`) and `error` (renders helper text below)

#### Badge (`components/ui/Badge.tsx`)

| Variant | Style |
|---|---|
| `default` | `bg-accent-light text-accent` |
| `overdue` | `bg-overdue-light text-overdue` |
| `muted` | `bg-muted text-muted-foreground` |
| `success` | Green tint |

All badges: `rounded-lg px-2 py-0.5 text-xs font-semibold`.

#### Modal (`components/ui/Modal.tsx`)

- `bg-card rounded-2xl border-2 border-border` with accent offset shadow
- `backdrop-blur-sm bg-black/50` overlay
- Escape key and backdrop click to close
- `overflow: hidden` on `body` while open to prevent background scroll

#### DatePicker (`components/ui/DatePicker.tsx`)

- Trigger button styled identically to `Input` (same border, radius, focus ring)
- Calendar rendered via `react-day-picker v9` in an absolute-positioned popover
- Click-outside dismissal via `mousedown` listener
- Clear (×) button when a date is selected
- Selected day: `bg-accent text-white`. Today: `font-bold text-accent`.

### 1.6 Task Row Variants

Task rows have two visual modes controlled by the `dailyVariant` boolean:

| Property | Standard | Daily |
|---|---|---|
| Background | `bg-card` | `bg-white/50` |
| Border | `border-border` | `border-accent/20` |
| Padding | `py-2.5` | `py-2` |
| Title weight | Normal | `font-medium` |
| Drag handle color | `text-border` → `text-muted-foreground` | `text-accent/20` → `text-accent/50` |
| Due date badges | Visible | Hidden |
| Completed opacity | `line-through text-muted-foreground` | + `opacity-60` on the row |

### 1.7 Header (`components/dashboard/DashboardHeader.tsx`)

- Sticky, `z-40`, `bg-card/90 backdrop-blur-sm border-b-2 border-border`
- Height: `h-14` (56px)
- Max content width: `max-w-7xl mx-auto`
- Brand: accent-colored logo mark (`w-7 h-7 bg-accent rounded-lg`) + wordmark with accent-colored "Flow"
- Active nav link: `bg-accent-light text-accent`. Inactive: `text-muted-foreground hover:text-foreground hover:bg-muted`

### 1.8 Accessibility

#### Color Contrast

All text/background pairings must meet WCAG AA (4.5:1 for normal text, 3:1 for large text / UI components).

| Pairing | Ratio (approx) | Passes AA |
|---|---|---|
| `--foreground` `#1a1a2e` on `--background` `#f7f6ff` | ~14:1 | Yes |
| `--foreground` `#1a1a2e` on `--card` `#ffffff` | ~17:1 | Yes |
| `--accent` `#6c5ce7` on `--background` `#f7f6ff` | ~5.1:1 | Yes |
| `--accent` `#6c5ce7` on `--accent-light` `#ede9ff` | ~3.2:1 | Yes (UI / large text) |
| `--muted-foreground` `#6b7280` on `--background` `#f7f6ff` | ~4.6:1 | Yes |
| `--accent-foreground` `#ffffff` on `--accent` `#6c5ce7` | ~5.1:1 | Yes |
| Dark: `--accent` `#7c6ff7` on `--background` `#0e0d1f` | ~7.2:1 | Yes |

> **Known issue — dark mode daily task rows:** `bg-white/50` on task rows inside the Daily card renders against `--accent-light: #1e1b3a` in dark mode, producing a near-opaque grey-purple surface. This should be replaced with a transparent or theme-aware token. See D-011.

#### Keyboard Navigation

| Component | Keyboard behaviour |
|---|---|
| Modal | `Escape` closes. Focus trapped inside while open. `Tab` cycles through interactive elements. |
| DatePicker | `Escape` / click-outside closes popover. Calendar days are navigable via arrow keys (react-day-picker default). |
| TaskCard | `Enter` / `Space` on checkbox toggles completion. Drag handle is `tabIndex={-1}` (intentionally removed from tab order — drag is pointer-only). |
| TaskContextMenu | Trigger button is focusable. Menu items must be keyboard-operable. |
| DashboardHeader nav | Standard `<Link>` elements — fully keyboard-navigable. |

#### ARIA Conventions

- Checkbox buttons: `aria-label="Mark complete"` / `aria-label="Mark incomplete"` (dynamic based on state)
- Drag handle: `aria-label="Drag to reorder"`, `tabIndex={-1}`
- Modal close button: `aria-label="Close"`
- DatePicker clear button: `aria-label="Clear date"`
- Category add button: `aria-label="Add {category} task"`
- Loading spinner: should carry `role="status"` and `aria-label="Loading"` (currently missing — to-do)

#### Focus Ring

System-wide focus visible pattern: `focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20`. Applied to Input and DatePicker trigger. Buttons rely on browser default `:focus-visible` unless overridden — audit needed.

### 1.9 Interactive States

Every interactive element should pass through this state progression:

| State | Visual treatment |
|---|---|
| **Default** | Resting style as documented per component |
| **Hover** | Border or text shifts toward `accent`; background lightens to `muted` or `accent-light` |
| **Focus** | `border-accent ring-2 ring-accent/20` (matches Input focus pattern) |
| **Active** | `opacity-80` or slight scale-down (`active:scale-95` where appropriate) |
| **Disabled** | `opacity-50 cursor-not-allowed` |
| **Loading** | Spinner replaces content; element remains `disabled` |

Per-component state summary:

| Component | Hover | Focus | Active | Disabled |
|---|---|---|---|---|
| Button `primary` | `opacity-90` | `ring-2 ring-accent/20` | `opacity-80` | `opacity-50 cursor-not-allowed` |
| Button `secondary` | `border-accent text-accent` | same | — | `opacity-50` |
| Button `danger` | `bg-overdue text-white` | `ring-2 ring-overdue/20` | — | `opacity-50` |
| Input | `border-accent/50` | `border-accent ring-2 ring-accent/20` | — | `opacity-50` |
| TaskCard | `border-accent/40` + shadow shift | — | — | — |
| Nav link | `text-foreground bg-muted` | browser default | — | — |

Loading state pattern: the dashboard page renders a centred `animate-spin` border-spinner (`w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full`) while `isLoading` is true.

### 1.10 Responsive Breakpoints

Tailwind's default breakpoint scale is used (mobile-first):

| Prefix | Min-width | Notes |
|---|---|---|
| _(none)_ | 0px | Base mobile styles |
| `sm` | 640px | Header shows user email (`hidden sm:block`) |
| `md` | 768px | — |
| `lg` | 1024px | Dashboard content at comfortable reading width |
| `xl` / `2xl` | 1280px+ | Constrained by `max-w-7xl` — content stops growing |

#### Layout behaviour by viewport

- **Mobile (< 640px):** Full-width stack of cards, no structural change needed (Option A chosen for this reason). `px-4` horizontal padding.
- **Tablet / desktop (≥ 640px):** Same stack; `sm:px-6` padding. Header user email visible.
- **Wide desktop (≥ 1280px):** `max-w-7xl mx-auto` prevents content stretching beyond comfortable line length.

#### Touch & drag interactions

- dnd-kit's `PointerSensor` handles both mouse and touch pointer events. The `activationConstraint: { distance: 8 }` prevents accidental drags on tap.
- A `TouchSensor` from `@dnd-kit/core` is used alongside `PointerSensor` with `activationConstraint: { delay: 200, tolerance: 8 }` — the 200ms delay distinguishes a tap (opens modal) from a drag on touch devices.
- Minimum tap target size: 44×44px per WCAG 2.5.5. The add button (`w-7 h-7` = 28px) and drag handle (`w-6` area) are below this threshold and should be revisited for mobile.

### 1.11 Animation & Transition System

#### Speed scale

| Duration | Token | Usage |
|---|---|---|
| `150ms` | `duration-150` | All interactive state changes (hover, focus, border, background, shadow, opacity). The single standard speed throughout the app. |
| `300ms` | `duration-300` | Reserved for larger layout transitions if introduced (e.g. panel slides, modal entrance). Not currently used. |

#### Property conventions

- Use `transition-colors` when only color/border/background changes (more performant than `transition-all`). The current codebase uses `transition-all duration-150` broadly — acceptable but worth narrowing over time.
- Use `transition-all duration-150` where shadow also transitions (task rows — shadow changes on hover alongside border color).
- Use `transition-transform` for scale/translate effects only (DragOverlay: `rotate-1 scale-105`).
- Avoid transitioning `width`, `height`, or `max-height` — causes layout recalculation. Use `opacity` + `visibility` instead for show/hide.

#### Micro-interactions in use

| Interaction | Implementation |
|---|---|
| Task card hover | Border color + shadow both shift in 150ms |
| Drag active | Original card `opacity-40`; overlay `rotate-1 scale-105` |
| Drag overlay | `dropAnimation={null}` — instant drop, no animation jank |
| Checkbox check | Border + background fill in 150ms (`transition-all`) |
| Category icon hover | `group-hover:scale-110 transition-transform` on empty state icon |
| Nav active state | `bg-accent-light text-accent` applied immediately on navigation |

### 1.12 Performance Patterns

#### React rendering

- `useMemo` in `CategorySection` computes `activeTasks`, `completedTasks`, and `maxSortOrder` in a single pass over the `tasks` array — avoids three separate `.filter()` calls triggering re-renders.
- `useMemo` in `DashboardPage` splits tasks into per-category buckets — prevents re-splitting on unrelated re-renders.
- `TaskCardContent` and `CompletedSection` are not memoized — acceptable given small list sizes. Add `React.memo` if task lists grow beyond ~50 items.

#### InstantDB query structure

- A single `db.useQuery` at the dashboard page root fetches all tasks with their daily completions filtered to today's `dateString`. This is intentional — one subscription for the entire dashboard rather than per-category or per-component queries, which would create multiple WebSocket listeners.
- The `dailyCompletions` sub-query uses a `where` filter (`{ dateString: today }`) to avoid loading all historical completion records.

#### Drag-and-drop

- `DragOverlay` renders a cloned `TaskCard` outside the sortable list. This prevents the layout from reflowing during drag (the original slot stays in the DOM at `opacity-40`).
- `dropAnimation={null}` disables dnd-kit's default drop animation, which can cause a visible snap on fast drops.
- `PointerSensor` with `activationConstraint: { distance: 8 }` delays drag start, preventing interference with click-to-open-modal.

#### Bundle considerations

- `react-day-picker` is loaded in `DatePicker.tsx` which is only imported in modal components — it is not on the critical path for the dashboard render.
- dnd-kit is imported in `TaskList.tsx` which renders on every dashboard load. Tree-shaking ensures only used exports are bundled.

### 1.13 Form Patterns

#### Field conventions

| Field type | Component | Required indicator |
|---|---|---|
| Short text | `Input` | Asterisk not shown — rely on submit-time validation |
| Long text | `<textarea>` (unstyled, matches Input classes manually) | — |
| Date | `DatePicker` | — |
| Category | Pill button group | One always selected (defaulted) |

#### Validation

- Validation is submit-time only (no on-blur). The `title` field is the only required field — checked with a simple `if (!title.trim())` guard before `db.transact`.
- No third-party form library is used (React Hook Form / Formik) — forms are simple enough that local `useState` is sufficient. Re-evaluate if forms grow beyond 5–6 fields.

#### Loading & error states

- Submit buttons are `disabled` while a transaction is pending (not yet implemented — to-do).
- InstantDB transactions are optimistic by default: the UI updates immediately and rolls back on error. No explicit loading spinner on form submit is strictly needed, but a `disabled` state on the Save button would prevent double-submits.
- Database errors surface via `error.message` in the dashboard (`if (error)` block). Modal-level errors are not currently handled.

---

## Part 2 — Design Decisions Log

### D-001 · Accent color — purple (`#6c5ce7`)

**Decision:** Use a single mid-weight purple as the primary brand color across interactive states, the Daily card, badges, focus rings, and shadows.

**Rationale:** Purple is distinctive in the productivity app space (most competitors use blue or green). It reads clearly as "interactive" against both the off-white `--background` and the dark mode `--background`. A single accent simplifies the palette — every interactive element shares the same hue, which creates visual cohesion without needing a secondary color.

---

### D-002 · neo-brutalist offset shadow system

**Decision:** Use hard 2–8px offset box shadows with no blur, colored with the accent at low opacity, instead of the standard blurred drop shadow.

**Rationale:** Blurred shadows soften UI and can feel generic. Offset shadows with no blur give a hand-crafted, graphic quality that differentiates the app. Using the accent color (rather than black) in the shadow ties every surface back to the brand palette. The shadow scale increases with perceived importance: task rows get 3px, cards get 4px, modals get 8px.

---

### D-003 · `border-2` throughout

**Decision:** Use 2px borders everywhere — cards, inputs, buttons, task rows — rather than 1px.

**Rationale:** 2px borders are a deliberate aesthetic choice that pairs with the offset shadow system. 1px borders look thin and fragile at that shadow scale. 2px creates a bolder, more tactile feel and makes interactive state changes (border color on hover/focus) more visible.

---

### D-004 · Daily tasks as a distinct card type

**Decision:** The Daily Habits section uses `bg-accent-light` with `border-accent/25` and purple shadow, while Personal and Business use neutral `bg-card`.

**Rationale:** Daily tasks are fundamentally different from regular tasks — they are habits/routines that reset each day, not one-off items with due dates. Giving them a tinted background at the top of the page signals this difference immediately. It also creates a visual hierarchy: the accent strip draws the eye first (morning routine check-in), then the neutral cards below (ongoing project tasks).

---

### D-005 · Full-width stack layout (Option A)

**Decision:** Dashboard is a vertical stack of full-width cards (Daily → Personal → Business) rather than a 3-column grid.

**Alternatives considered:**
- **Option B (Daily sidebar + wide panels):** Daily as a narrow left column, Personal/Business stacked on the right. Rejected because the fixed sidebar height looks awkward when Daily has few tasks, and it is harder to adapt for mobile.
- **Option C (Habit strip + 50/50 bento grid):** Daily as a full-width pill-chip strip, Personal/Business in a 50% side-by-side grid below. Rejected because the pill layout works poorly with longer habit names and the 50% columns still truncate titles on mid-size screens.

**Rationale for Option A:** Full-width rows mean task titles never truncate regardless of viewport width. The vertical reading order matches natural scanning behavior (daily habits first, project tasks below). All three categories get equal treatment in terms of row width. Mobile layout is trivially the same — no column collapsing needed.

---

### D-006 · Daily completion via junction records, not a boolean

**Decision:** Completing a daily task creates a `dailyCompletions` record with a `dateString` field rather than toggling a `completed` boolean.

**Rationale:** A boolean `completed` flag would require a nightly cron job to reset it. Using junction records keyed by `dateString` ("YYYY-MM-DD") means the app asks "does a completion record exist for today?" — no reset job needed. Each day's completions are also preserved as history, enabling streak tracking or analytics in the future.

---

### D-007 · `sortOrder` midpoint reordering

**Decision:** Drag-and-drop reordering uses a midpoint algorithm on a numeric `sortOrder` field rather than an ordinal integer array.

**Rationale:** Storing ordinal indexes (0, 1, 2…) would require updating all records after the reordered item on every drag, which is O(n) writes. Midpoint reordering (new position = (prev.sortOrder + next.sortOrder) / 2) is a single-record write. Initial gaps of 1000 give ample room for insertions before floating-point precision becomes a concern.

---

### D-008 · Completed tasks always visible (no collapse)

**Decision:** Completed tasks are always shown in a "Completed" sub-section within each category, never hidden behind a toggle.

**Rationale:** Collapsible sections add interaction cost with little benefit — the completed count badge already summarises what is there. Always-visible completed tasks make it easy to uncheck something if marked complete by mistake. The `opacity-60` treatment on completed rows provides sufficient visual separation without hiding them.

---

### D-009 · react-day-picker for date selection

**Decision:** Replace `<input type="date">` with a custom popover calendar using `react-day-picker v9`.

**Rationale:** Native date inputs have inconsistent styling across browsers and operating systems — they cannot be matched to the design system. `react-day-picker` is headless (no bundled CSS), so all calendar styles are applied via the existing Tailwind design tokens, keeping the calendar visually consistent with the rest of the app.

---

### D-010 · Magic code auth (no passwords)

**Decision:** Authentication is email-only magic codes (OTP), no passwords.

**Rationale:** Passwords require hashing, reset flows, and strength validation. Magic codes remove all of that while maintaining security. The two-step flow (enter email → enter code) is handled entirely by InstantDB's `sendMagicCode` / `signInWithMagicCode` API, keeping the auth surface minimal.

---

### D-011 · `bg-white/50` on daily task rows in dark mode — resolved

**Problem:** Daily task rows used `bg-white/50` which rendered as a semi-transparent white overlay. In dark mode, `--accent-light` becomes `#1e1b3a` (deep navy) and `bg-white/50` produced a washed-out grey-purple that broke the intended frosted effect and failed contrast checks.

**Resolution:** Replaced `bg-white/50` / `hover:bg-white/70` with `bg-card/60` / `hover:bg-card/80` in `TaskCard.tsx`. The `--card` token is theme-aware (`#ffffff` light, `#171628` dark), so the frosted effect now adapts correctly in both modes.

---

### D-012 · `transition-all` vs `transition-colors` — deferred optimisation

**Decision:** The codebase currently uses `transition-all duration-150` broadly across interactive elements.

**Rationale:** `transition-all` is marginally less performant than scoped transitions (`transition-colors`, `transition-shadow`) because the browser monitors all animatable properties. For the current scale (< 50 task rows visible at once) this is not measurable. The decision to use `transition-all` was a deliberate speed-of-development trade-off. If profiling reveals paint/composite jank, narrow transitions should be applied per element.

---

### D-013 · No form library — local `useState` for forms

**Decision:** CreateTaskModal and TaskDetailModal use local `useState` for form fields rather than React Hook Form or Formik.

**Rationale:** Both forms have at most 5 fields and a single submit action. Introducing a form library at this scale adds bundle weight and indirection with no measurable benefit. The threshold for reconsidering is multi-step forms, complex cross-field validation, or forms that appear in more than 4–5 places across the app.
