import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrollt bei jedem Routenwechsel an den Anfang der Seite.
 * SYSTAX-konform – identisches Verhalten wie im Hauptsystem.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}
