"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leadingIcon?: React.ReactNode;
  trailingElement?: React.ReactNode;
  mono?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, leadingIcon, trailingElement, mono, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    return (
      <div className="relative">
        {leadingIcon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            {leadingIcon}
          </div>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-lg border bg-[rgb(8_14_32_/_0.86)] px-3 text-sm text-[var(--text-primary)] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.03)] outline-none transition-colors placeholder:text-[var(--text-muted)] disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-[var(--error)]" : "border-[var(--border-strong)] focus:border-[var(--border-focus)]",
            !error && "focus:shadow-[var(--shadow-focus)]",
            leadingIcon && "pl-9",
            trailingElement && "pr-10",
            mono && "font-mono tabular-nums",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {trailingElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">{trailingElement}</div>
        )}
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs font-medium text-[var(--error)]">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export function Label({ className, required, ...props }: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label className={cn("mb-1.5 block text-sm font-medium text-[var(--text-primary)]", className)} {...props}>
      {props.children}
      {required && <span className="ml-0.5 text-[var(--error)]">*</span>}
    </label>
  );
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs text-[var(--text-muted)]">{children}</p>;
}
