import { useEffect, useRef, ReactNode } from "react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "@/hooks/use-toast";

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000; // 15 Min — DSGVO/Lohndaten
const WARNING_BEFORE_MS = 60 * 1000;       // 1 Min Vorwarnung

interface SessionTimeoutProviderProps {
  children: ReactNode;
  timeoutMs?: number;
}

/**
 * Auto-Logout bei Inaktivität – DSGVO-konform für Lohndaten.
 *
 * SYSTAX-Integration: Im Hauptsystem wird dieser Provider durch den
 * SYSTAX-eigenen `SessionTimeoutProvider` ersetzt (identische API).
 */
export function SessionTimeoutProvider({
  children,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: SessionTimeoutProviderProps) {
  const { user, signOut } = useAuth();
  const timerRef = useRef<number | null>(null);
  const warnRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user) return;

    const reset = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (warnRef.current) window.clearTimeout(warnRef.current);

      warnRef.current = window.setTimeout(() => {
        toast({
          title: "Sitzung läuft ab",
          description: "Sie werden in 1 Minute aus Sicherheitsgründen abgemeldet.",
        });
      }, timeoutMs - WARNING_BEFORE_MS);

      timerRef.current = window.setTimeout(() => {
        signOut?.();
      }, timeoutMs);
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (warnRef.current) window.clearTimeout(warnRef.current);
    };
  }, [user, signOut, timeoutMs]);

  return <>{children}</>;
}
