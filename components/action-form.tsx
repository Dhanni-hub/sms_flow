"use client";

import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/app/actions/auth";
import type { FormState } from "@/app/actions/resources";

type ServerAction = (prev: ActionState & FormState, formData: FormData) => Promise<ActionState & FormState>;

export function ActionForm({
  action,
  children,
  submitLabel,
  className,
}: {
  action: ServerAction;
  children: React.ReactNode;
  submitLabel: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className={className ?? "space-y-4"}>
      {state.error && <p className="rounded-md border border-[var(--error-subtle-border)] bg-[var(--error-subtle)] px-3 py-2 text-sm text-[var(--error-text)]">{state.error}</p>}
      {state.success && <p className="rounded-md border border-[var(--success-subtle-border)] bg-[var(--success-subtle)] px-3 py-2 text-sm text-[var(--success-text)]">{state.success}</p>}
      {children}
      <Button type="submit" loading={pending} className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
