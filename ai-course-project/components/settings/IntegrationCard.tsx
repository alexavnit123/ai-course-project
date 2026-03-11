import { cn } from "@/lib/utils";

interface IntegrationCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
}

export default function IntegrationCard({
  name,
  description,
  icon,
  comingSoon = false,
}: IntegrationCardProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 p-5 rounded-2xl border-2 border-border bg-card",
        "shadow-[3px_3px_0px_0px_rgba(0,0,0,0.04)]",
        comingSoon && "opacity-60"
      )}
    >
      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-bold text-foreground">{name}</h3>
          {comingSoon && (
            <span className="text-[10px] font-semibold bg-accent-light text-accent px-2 py-0.5 rounded-full">
              Soon
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        disabled={comingSoon}
        className={cn(
          "shrink-0 px-3 py-1.5 rounded-xl border-2 text-xs font-semibold transition-all",
          comingSoon
            ? "border-border text-muted-foreground cursor-not-allowed"
            : "border-accent text-accent hover:bg-accent hover:text-white"
        )}
      >
        {comingSoon ? "Coming soon" : "Connect"}
      </button>
    </div>
  );
}
