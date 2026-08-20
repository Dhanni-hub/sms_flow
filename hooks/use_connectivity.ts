"use client";

import { useEffect, useState } from "react";
import type { ConnectivityState } from "@/types";

/**
 * Tracks browser online/offline state. This governs the "Queued locally"
 * vs "Successfully sent" distinction required throughout the send flows —
 * the UI must never claim a message was sent while offline.
 */
export function useConnectivity(): ConnectivityState {
  const [state, setState] = useState<ConnectivityState>("online");

  useEffect(() => {
    setState(navigator.onLine ? "online" : "offline");
    const goOnline = () => setState("online");
    const goOffline = () => setState("offline");
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return state;
}