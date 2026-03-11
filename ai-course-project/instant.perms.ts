// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react";

const rules = {
  tasks: {
    allow: {
      view: "isOwner",
      create: "isOwner",
      update: "isOwner",
      delete: "isOwner",
    },
    bind: { isOwner: "auth.id != null && auth.id == data.ownerId" },
  },
  dailyCompletions: {
    allow: {
      view: "isOwner",
      create: "isOwner",
      update: "isOwner",
      delete: "isOwner",
    },
    bind: { isOwner: "auth.id != null && auth.id == data.ownerId" },
  },
  userSettings: {
    allow: {
      view: "isOwner",
      create: "isOwner",
      update: "isOwner",
      delete: "isOwner",
    },
    bind: { isOwner: "auth.id != null && auth.id == data.ownerId" },
  },
} satisfies InstantRules;

export default rules;
