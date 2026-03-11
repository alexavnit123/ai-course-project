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
