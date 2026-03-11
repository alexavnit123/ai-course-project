export const CATEGORIES = ["daily", "personal", "business"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  daily: "Daily",
  personal: "Personal",
  business: "Business",
};

export const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  daily: "Recurring tasks for every day",
  personal: "Personal to-dos and reminders",
  business: "Work tasks and projects",
};

export const PRIORITY_OPTIONS = [
  { value: 1, label: "High",   dot: "bg-red-500"   },
  { value: 2, label: "Medium", dot: "bg-amber-400" },
  { value: 3, label: "Low",    dot: "bg-blue-400"  },
] as const;

export type Priority = 1 | 2 | 3;
export type SortMode = "manual" | "priority" | "dueDate";
