import { cn } from "@/lib/cn";

interface StepsProps {
  current: number;
  labels: string[];
}

export function Steps({ current, labels }: StepsProps) {
  return (
    <ol className="grid gap-2 sm:grid-cols-7">
      {labels.map((label, index) => {
        const active = index + 1 === current;
        const complete = index + 1 < current;

        return (
          <li
            key={label}
            className={cn(
              "rounded-lg border px-3 py-2 text-xs",
              complete && "border-zinc-900 bg-zinc-900 text-white",
              active && "border-zinc-900 bg-zinc-50 text-zinc-900",
              !active && !complete && "border-zinc-200 text-zinc-500",
            )}
          >
            {index + 1}. {label}
          </li>
        );
      })}
    </ol>
  );
}
