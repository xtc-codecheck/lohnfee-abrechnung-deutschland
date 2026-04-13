import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DarkModeToggle } from "@/components/ui/dark-mode-toggle";
import {
  Users,
  Calculator,
  Clock,
  Shield,
  FileText,
  Zap,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Lock,
  Building2,
} from "lucide-react";

const features = [
  {
    icon: Calculator,
    title: "Lohnabrechnung",
    description:
      "Automatisierte Brutto-Netto-Berechnung mit aktuellen Steuer- und SV-Sätzen für 2026.",
  },
  {
    icon: Users,
    title: "Mitarbeiterverwaltung",
    description:
      "Vollständige Personalakte mit Stammdaten, Verträgen und Dokumenten an einem Ort.",
  },
  {
    icon: Clock,
    title: "Zeiterfassung",
    description:
      "Digitale Arbeitszeiterfassung mit Urlaubsverwaltung und Überstundenkonten.",
  },
  {
    icon: FileText,
    title: "Meldewesen",
    description:
      "SV-Meldungen, Beitragsnachweise und Lohnsteuerbescheinigungen auf Knopfdruck.",
  },
  {
    icon: Shield,
    title: "Compliance & DSGVO",
    description:
      "Automatische Compliance-Prüfungen und vollständige DSGVO-konforme Datenverwaltung.",
  },
  {
    icon: Zap,
    title: "Autolohn",
    description:
      "Wiederkehrende Abrechnungen automatisieren – von der Berechnung bis zur Übermittlung.",
  },
  {
    icon: BarChart3,
    title: "Auswertungen & Reports",
    description:
      "Personalkosten, Steuerübersichten und individuelle Berichte als PDF oder DATEV-Export.",
  },
  {
    icon: Lock,
    title: "Multi-Tenant & Rollen",
    description:
      "Mandantenfähig mit feingranularer Rechteverwaltung – perfekt für Steuerkanzleien.",
  },
];

const benefits = [
  "GoBD-konforme Verarbeitung",
  "DATEV-Schnittstelle",
  "Automatische SV-Meldungen",
  "Branchenmodule (Bau, Gastro, Pflege)",
  "Echtzeit-Anomalie-Erkennung",
  "Verschlüsselte Daten in der Cloud",
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">L</span>
            </div>
            <span className="text-xl font-bold">LohnPro</span>
          </div>
          <div className="flex items-center gap-3">
            <DarkModeToggle />
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Anmelden
            </Button>
            <Button onClick={() => navigate("/auth")}>
              Kostenlos starten
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 -z-10 opacity-[0.03]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,hsl(var(--primary)),transparent_60%)]" />
        </div>
        <div className="container mx-auto px-6 text-center">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              Für Unternehmen & Steuerkanzleien
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Lohnabrechnung.{" "}
              <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                Einfach. Sicher.
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              LohnPro automatisiert Ihre gesamte Entgeltabrechnung – von der
              Brutto-Netto-Berechnung über SV-Meldungen bis zum DATEV-Export.
              DSGVO-konform und immer auf dem neuesten Stand.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="text-base" onClick={() => navigate("/auth")}>
                Jetzt kostenlos testen
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-base" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
                Features entdecken
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Bar */}
      <section className="border-y border-border bg-muted/50 py-8">
        <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6">
          {benefits.map((b) => (
            <div key={b} className="flex items-center gap-2 text-sm font-medium text-foreground">
              <CheckCircle className="h-4 w-4 text-secondary" />
              {b}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Alles, was Sie für die Lohnabrechnung brauchen
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Eine Plattform – von der Zeiterfassung bis zur Meldung ans Finanzamt.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <Card
                key={f.title}
                className="group border-border/60 transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {f.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-12 text-center shadow-lg">
            <h2 className="text-3xl font-bold">Bereit loszulegen?</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Erstellen Sie Ihr kostenloses Konto und starten Sie in wenigen Minuten
              mit Ihrer ersten Abrechnung.
            </p>
            <Button size="lg" className="mt-8 text-base" onClick={() => navigate("/auth")}>
              Kostenlos registrieren
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <span className="text-sm font-bold text-primary-foreground">L</span>
            </div>
            <span className="text-sm font-medium">LohnPro</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} LohnPro. Alle Rechte vorbehalten.
          </p>
        </div>
      </footer>
    </div>
  );
}
