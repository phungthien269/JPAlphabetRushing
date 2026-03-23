import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45",
  {
    variants: {
      variant: {
        primary: "bg-[var(--color-accent)] text-slate-950 hover:bg-[var(--color-accent-strong)]",
        secondary: "border border-[var(--color-border)] bg-white/55 text-[var(--color-text)] hover:bg-white/75 dark:bg-slate-950/25 dark:hover:bg-slate-950/35",
        ghost: "text-[var(--color-text)] hover:bg-white/45 dark:hover:bg-slate-950/25",
        danger: "bg-red-500 text-white hover:bg-red-600",
      },
      size: {
        sm: "px-3 py-2 text-xs",
        md: "px-4 py-2.5 text-sm",
        lg: "px-5 py-3 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("surface-card rounded-[1.5rem] border p-5", className)}
    {...props}
  />
));
Card.displayName = "Card";

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--color-border)] bg-white/60 px-3 py-1 text-xs font-medium text-[var(--color-text-muted)] dark:bg-slate-950/25",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h2 className="font-[var(--font-heading)] text-xl font-semibold text-[var(--color-text)]">{title}</h2>
        {description ? <p className="max-w-2xl text-sm text-[var(--color-text-muted)]">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: ReactNode;
}) {
  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
        {accent}
      </div>
      <div className="font-[var(--font-heading)] text-2xl font-semibold tracking-tight">{value}</div>
    </Card>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 rounded-full bg-slate-200/70 dark:bg-slate-800">
      <div
        className="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-300"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="space-y-3 p-8 text-center">
      <div className="font-[var(--font-heading)] text-lg font-semibold">{title}</div>
      <p className="mx-auto max-w-md text-sm text-[var(--color-text-muted)]">{description}</p>
      {action}
    </Card>
  );
}
