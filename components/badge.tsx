import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-[var(--surface-sunken)] border-[var(--border)] text-[var(--text-secondary)]",
        brand: "bg-[var(--brand-subtle)] border-[var(--brand-subtle-border)] text-[var(--brand)]",
        success: "bg-[var(--success-subtle)] border-[var(--success-subtle-border)] text-[var(--success-text)]",
        warning: "bg-[var(--warning-subtle)] border-[var(--warning-subtle-border)] text-[var(--warning-text)]",
        error: "bg-[var(--error-subtle)] border-[var(--error-subtle-border)] text-[var(--error-text)]",
        info: "bg-[var(--info-subtle)] border-[var(--info-subtle-border)] text-[var(--info-text)]",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, className }))} {...props}>
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            variant === "success" && "bg-[var(--success)]",
            variant === "warning" && "bg-[var(--warning)]",
            variant === "error" && "bg-[var(--error)]",
            variant === "info" && "bg-[var(--info)]",
            variant === "brand" && "bg-[var(--brand)]",
            (!variant || variant === "neutral") && "bg-[var(--text-muted)]"
          )}
        />
      )}
      {children}
    </span>
  );
}