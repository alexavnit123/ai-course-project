import { cn } from "@/lib/utils";

interface IntegrationCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
  connected?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export default function IntegrationCard({
  name,
  description,
  icon,
  comingSoon = false,
  connected = false,
  onConnect,
  onDisconnect,
}: IntegrationCardProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 p-5 rounded-2xl border-2 bg-card",
        "shadow-[3px_3px_0px_0px_rgba(0,0,0,0.04)]",
        connected ? "border-green-200" : "border-border",
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
      {comingSoon ? (
        <button
          disabled
          className="shrink-0 px-3 py-1.5 rounded-xl border-2 text-xs font-semibold border-border text-muted-foreground cursor-not-allowed"
        >
          Coming soon
        </button>
      ) : connected ? (
        <div className="shrink-0 flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-green-200 text-xs font-semibold text-green-600">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Connected
          </div>
          {onDisconnect && (
            <button
              onClick={onDisconnect}
              className="px-3 py-1.5 rounded-xl border-2 border-border text-xs font-semibold text-muted-foreground hover:border-red-300 hover:text-red-500 transition-all"
            >
              Disconnect
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={onConnect}
          className="shrink-0 px-3 py-1.5 rounded-xl border-2 text-xs font-semibold border-accent text-accent hover:bg-accent hover:text-white transition-all"
        >
          Connect
        </button>
      )}
    </div>
  );
}
