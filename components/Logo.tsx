import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
};

export function Logo({ className, markClassName, showWordmark = true }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-foreground", className)}>
      <svg
        className={cn("h-8 w-8 shrink-0", markClassName)}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="64" height="64" rx="16" className="fill-primary" />
        <rect x="10" y="12" width="12" height="40" rx="3" fill="currentColor" className="text-primary-foreground opacity-30" />
        <rect x="26" y="12" width="12" height="40" rx="3" fill="currentColor" className="text-primary-foreground opacity-55" />
        <rect x="42" y="12" width="12" height="40" rx="3" fill="currentColor" className="text-primary-foreground opacity-30" />
        <rect x="10" y="28" width="44" height="8" rx="2" className="fill-accent" />
        <circle cx="32" cy="32" r="3.5" className="fill-primary-foreground" />
      </svg>
      {showWordmark ? <span className="text-lg font-bold tracking-tight">TimeGrid</span> : null}
    </span>
  );
}
