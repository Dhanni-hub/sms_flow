"use client";

import { WifiOff } from "lucide-react";
import { useConnectivity } from "@/hooks/use-connectivity";

export function NetworkStatusBanner() {
  const status = useConnectivity();

  if (status !== "offline") return null;

  return (
    <div className="overflow-hidden">
      <div className="flex items-center justify-center gap-2 bg-[var(--warning-subtle)] px-4 py-2 text-center">
        <WifiOff className="h-3.5 w-3.5 shrink-0 text-[var(--warning-text)]" />
        <p className="text-xs font-medium text-[var(--warning-text)]">
          You&apos;re offline. Messages will be queued locally and sent once you&apos;re back online.
        </p>
      </div>
    </div>
  );
}
