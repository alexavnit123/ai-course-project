import { TaskWithCompletions, TaskCardContent } from "./TaskCard";

interface CompletedSectionProps {
  tasks: TaskWithCompletions[];
  today: string;
  userId: string;
  dailyVariant?: boolean;
}

export default function CompletedSection({
  tasks,
  today,
  userId,
  dailyVariant,
}: CompletedSectionProps) {
  if (tasks.length === 0) return null;

  return (
    <div className="mt-4">
      {/* Section label */}
      <div className="flex items-center gap-2 px-1 mb-2">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Completed
        </span>
        <span className="bg-muted text-muted-foreground rounded-md px-1.5 py-0.5 text-xs font-medium">
          {tasks.length}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-border rounded-full mb-2" />

      {/* Tasks */}
      <div className="flex flex-col gap-1.5 opacity-60">
        {tasks.map((task) => (
          <TaskCardContent
            key={task.id}
            task={task}
            today={today}
            userId={userId}
            dailyVariant={dailyVariant}
          />
        ))}
      </div>
    </div>
  );
}
