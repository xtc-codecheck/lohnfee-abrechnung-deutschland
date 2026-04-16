/**
 * CookieConsent – DSGVO-konformer Cookie-Banner
 * ─────────────────────────────────────────────
 * Wird nur auf der Landing Page angezeigt, solange noch keine
 * Entscheidung getroffen wurde. Die Wahl wird in localStorage
 * persistiert.
 *
 * LohnPro nutzt aktuell keine Tracking-Cookies — der Banner
 * dokumentiert lediglich die rein technisch notwendigen Cookies
 * (Session, Auth) und erfüllt damit die Informationspflicht
 * nach Art. 13 DSGVO + § 25 TTDSG.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "lohnpro.cookie-consent.v1";

type ConsentValue = "accepted" | "essential-only";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      // localStorage nicht verfügbar (Privacy-Modus) → Banner anzeigen
      setVisible(true);
    }
  }, []);

  const persist = (value: ConsentValue) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6 pointer-events-none"
    >
      <div className="mx-auto max-w-3xl pointer-events-auto rounded-xl border border-border bg-card text-card-foreground shadow-lg">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Cookie className="h-5 w-5" />
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h2 id="cookie-consent-title" className="text-base font-semibold leading-tight">
                  Cookies & Datenschutz
                </h2>
                <button
                  type="button"
                  onClick={() => persist("essential-only")}
                  aria-label="Banner schließen (nur essenzielle Cookies)"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Wir verwenden ausschließlich technisch notwendige Cookies, damit
                die Anmeldung und Sitzungsverwaltung funktioniert. Es findet
                kein Tracking, keine Werbung und keine Datenweitergabe an
                Dritte statt.{" "}
                <Link
                  to="/datenschutz"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Datenschutzerklärung
                </Link>
                .
              </p>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => persist("essential-only")}
                >
                  Nur essenzielle
                </Button>
                <Button size="sm" onClick={() => persist("accepted")}>
                  Verstanden
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
