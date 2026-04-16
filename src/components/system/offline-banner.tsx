import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Zeigt ein dezentes Banner an, wenn der Browser offline ist.
 * Kritisch für Lohnabrechnung: Schreibvorgänge müssen verlässlich sein.
 */
export function OfflineBanner() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 inset-x-0 z-[100] bg-destructive text-destructive-foreground text-sm py-2 px-4 flex items-center justify-center gap-2 shadow-md"
    >
      <WifiOff className="h-4 w-4" />
      <span>Sie sind offline. Änderungen werden derzeit nicht gespeichert.</span>
    </div>
  );
}
