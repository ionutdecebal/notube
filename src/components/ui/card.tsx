import { cn } from "@/lib/cn";

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-800/90 bg-zinc-950/80 p-6 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur",
        className,
      )}
    >
      {children}
    </div>
  );
}
