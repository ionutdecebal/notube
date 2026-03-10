import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: "border border-zinc-600 bg-zinc-200 text-zinc-900 hover:bg-zinc-100",
  secondary: "border border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800",
  ghost: "bg-transparent text-zinc-400 hover:text-zinc-200",
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variantClass[variant],
        className,
      )}
      {...props}
    />
  );
}
