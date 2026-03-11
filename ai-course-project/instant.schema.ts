// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $streams: i.entity({
      abortReason: i.string().optional(),
      clientId: i.string().unique().indexed(),
      done: i.boolean().optional(),
      size: i.number().optional(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      imageURL: i.string().optional(),
      type: i.string().optional(),
    }),
    tasks: i.entity({
      title: i.string(),
      category: i.string().indexed(),
      dueDate: i.number().indexed().optional(),
      completed: i.boolean().indexed(),
      isDaily: i.boolean().indexed(),
      sortOrder: i.number().indexed(),
      createdAt: i.number().indexed(),
      description: i.string().optional(),
      ownerId: i.string().indexed(),
    }),
    dailyCompletions: i.entity({
      dateString: i.string().indexed(),
      completedAt: i.number(),
      ownerId: i.string().indexed(),
    }),
  },
  links: {
    $streams$files: {
      forward: {
        on: "$streams",
        has: "many",
        label: "$files",
      },
      reverse: {
        on: "$files",
        has: "one",
        label: "$stream",
        onDelete: "cascade",
      },
    },
    $usersLinkedPrimaryUser: {
      forward: {
        on: "$users",
        has: "one",
        label: "linkedPrimaryUser",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "linkedGuestUsers",
      },
    },
    taskOwner: {
      forward: {
        on: "tasks",
        has: "one",
        label: "owner",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "tasks",
      },
    },
    dailyCompletionTask: {
      forward: {
        on: "dailyCompletions",
        has: "one",
        label: "task",
        onDelete: "cascade",
      },
      reverse: {
        on: "tasks",
        has: "many",
        label: "dailyCompletions",
      },
    },
    dailyCompletionOwner: {
      forward: {
        on: "dailyCompletions",
        has: "one",
        label: "owner",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "dailyCompletions",
      },
    },
  },
  rooms: {},
});

// This helps TypeScript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
