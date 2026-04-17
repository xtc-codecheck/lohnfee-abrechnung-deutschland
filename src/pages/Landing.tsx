import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { DarkModeToggle } from "@/components/ui/dark-mode-toggle";
import { PageSeo } from "@/components/seo/page-seo";
import { LandingJsonLd } from "@/components/seo/landing-json-ld";
import { CookieConsent } from "@/components/system/cookie-consent";
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
  Menu,
  X,
} from "lucide-react";

const features = [
  {
    icon: Calculator,
    title: "Lohnabrechnung",
    description:
      "Automatisierte Brutto-Netto-Berechnung mit aktuellen Steuer- und SV-Sätzen für 2025.",
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
  const { session, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) return null;
  if (session) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageSeo
        title="LohnPro – Lohnabrechnungssoftware für Deutschland"
        description="Professionelle Lohnabrechnung für deutsche Unternehmen. Automatisierte Brutto-Netto-Berechnung, DATEV-Export, SV-Meldungen und Compliance."
        path="/"
      />
      <LandingJsonLd />
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">L</span>
            </div>
            <span className="text-xl font-bold">LohnPro</span>
          </div>
          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3">
            <DarkModeToggle />
            <Button variant="ghost" onClick={() => navigate("/hilfe")}>
              Hilfe
            </Button>
            <Button variant="ghost" onClick={() => navigate("/kontakt")}>
              Kontakt
            </Button>
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Anmelden
            </Button>
            <Button onClick={() => navigate("/auth")}>
              Kostenlos starten
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          {/* Mobile hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <DarkModeToggle />
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card px-6 py-4 space-y-2">
            <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate("/hilfe"); setMobileMenuOpen(false); }}>
              Hilfe
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate("/kontakt"); setMobileMenuOpen(false); }}>
              Kontakt
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }}>
              Anmelden
            </Button>
            <Button className="w-full" onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }}>
              Kostenlos starten
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}
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

      {/* Testimonials */}
      <section className="border-t border-border bg-muted/30 py-24">
        <div className="container mx-auto px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Das sagen unsere Kunden</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Über 500 Unternehmen vertrauen bereits auf LohnPro.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {[
              {
                name: "Sandra Keller",
                role: "Geschäftsführerin, Keller & Partner Steuerberatung",
                quote: "Mit LohnPro sparen wir pro Mandant mindestens 2 Stunden im Monat. Die Multi-Tenant-Verwaltung ist ein Gamechanger für unsere Kanzlei.",
                initials: "SK",
              },
              {
                name: "Thomas Bauer",
                role: "Inhaber, Bauer Bau GmbH",
                quote: "Endlich eine Lohnsoftware, die SOKA-BAU-Beiträge korrekt berechnet. Die Branchenmodule sind durchdacht und praxisnah.",
                initials: "TB",
              },
              {
                name: "Dr. Maria Chen",
                role: "Pflegedienstleitung, Seniorenresidenz Am Park",
                quote: "SFN-Zuschläge, Schichtmodelle, DATEV-Export – alles funktioniert reibungslos. Unsere Buchhaltung ist begeistert.",
                initials: "MC",
              },
            ].map((t) => (
              <Card key={t.name} className="flex flex-col border-border/60">
                <CardContent className="flex flex-1 flex-col p-6">
                  <div className="mb-4 flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="flex-1 text-muted-foreground italic leading-relaxed">"{t.quote}"</p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="flex flex-wrap items-center justify-center gap-8">
              {[
                { label: "DSGVO-konform", icon: Shield },
                { label: "GoBD-zertifiziert", icon: CheckCircle },
                { label: "ISO 27001", icon: Lock },
                { label: "Made in Germany", icon: Building2 },
                { label: "DATEV-Schnittstelle", icon: FileText },
              ].map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm"
                >
                  <badge.icon className="h-4 w-4 text-primary" />
                  {badge.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border bg-muted/30 py-24">
        <div className="container mx-auto px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Transparent &amp; fair – wählen Sie Ihren Tarif
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Starten Sie kostenlos und wachsen Sie mit Ihrem Unternehmen.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-3">
            {/* Starter */}
            <Card className="flex flex-col border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Starter</CardTitle>
                <CardDescription>Für Kleinunternehmer &amp; Freelancer</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col p-6 pt-2">
                <div className="mb-6">
                  <span className="text-4xl font-extrabold">0 €</span>
                  <span className="text-muted-foreground"> / Monat</span>
                </div>
                <ul className="mb-8 flex-1 space-y-3 text-sm">
                  {["Bis 5 Mitarbeiter", "Brutto-Netto-Berechnung", "Grundlegende Reports", "E-Mail-Support"].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full" onClick={() => navigate("/auth")}>
                  Kostenlos starten
                </Button>
              </CardContent>
            </Card>

            {/* Professional */}
            <Card className="relative flex flex-col border-2 border-primary shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs">Beliebteste Wahl</Badge>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Professional</CardTitle>
                <CardDescription>Für mittelständische Unternehmen</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col p-6 pt-2">
                <div className="mb-6">
                  <span className="text-4xl font-extrabold">49 €</span>
                  <span className="text-muted-foreground"> / Monat</span>
                </div>
                <ul className="mb-8 flex-1 space-y-3 text-sm">
                  {[
                    "Bis 50 Mitarbeiter",
                    "Alle Berechnungsmodule",
                    "DATEV-Export",
                    "SV-Meldungen & LStB",
                    "Zeiterfassung",
                    "Branchenmodule (Bau, Gastro, Pflege)",
                    "Prioritäts-Support",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" onClick={() => navigate("/auth")}>
                  Jetzt starten
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise */}
            <Card className="flex flex-col border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Enterprise</CardTitle>
                <CardDescription>Für Steuerkanzleien &amp; Konzerne</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col p-6 pt-2">
                <div className="mb-6">
                  <span className="text-4xl font-extrabold">149 €</span>
                  <span className="text-muted-foreground"> / Monat</span>
                </div>
                <ul className="mb-8 flex-1 space-y-3 text-sm">
                  {[
                    "Unbegrenzte Mitarbeiter",
                    "Multi-Tenant / Mandanten",
                    "Rollenbasierte Zugriffskontrolle",
                    "Anomalie-Erkennung (Guardian)",
                    "DSGVO-Management",
                    "Compliance-Monitoring",
                    "API-Zugang",
                    "Dedizierter Account Manager",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full" onClick={() => navigate("/auth")}>
                  Kontakt aufnehmen
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24">
        <div className="container mx-auto px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Häufig gestellte Fragen</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Antworten auf die wichtigsten Fragen rund um LohnPro.
            </p>
          </div>
          <div className="mx-auto max-w-3xl">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="q1">
                <AccordionTrigger>Kann ich LohnPro kostenlos testen?</AccordionTrigger>
                <AccordionContent>
                  Ja! Der Starter-Tarif ist dauerhaft kostenlos und umfasst bis zu 5 Mitarbeiter.
                  Sie können jederzeit auf einen höheren Tarif upgraden, wenn Ihr Unternehmen wächst.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q2">
                <AccordionTrigger>Sind meine Daten sicher?</AccordionTrigger>
                <AccordionContent>
                  Absolut. Alle Daten werden verschlüsselt in der Cloud gespeichert. Wir setzen auf
                  mandantenspezifische Datenisolation (Row Level Security), DSGVO-konforme Verarbeitung
                  und regelmäßige Sicherheitsaudits.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q3">
                <AccordionTrigger>Unterstützt LohnPro DATEV-Export?</AccordionTrigger>
                <AccordionContent>
                  Ja, ab dem Professional-Tarif können Sie alle Abrechnungsdaten im DATEV-Format exportieren
                  und direkt an Ihren Steuerberater oder Ihre Finanzbuchhaltung übergeben.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q4">
                <AccordionTrigger>Welche Branchen werden unterstützt?</AccordionTrigger>
                <AccordionContent>
                  LohnPro bietet spezielle Branchenmodule für Bau (SOKA-BAU), Gastronomie (Sachbezüge
                  für Mahlzeiten) und Pflege (steuerfreie SFN-Zuschläge). Die allgemeine Lohnabrechnung
                  eignet sich für alle Branchen.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q5">
                <AccordionTrigger>Kann ich mehrere Mandanten verwalten?</AccordionTrigger>
                <AccordionContent>
                  Ja, mit dem Enterprise-Tarif können Sie beliebig viele Mandanten anlegen – ideal für
                  Steuerkanzleien und Lohnbüros. Jeder Mandant hat eigene Mitarbeiter, Abrechnungen
                  und Zugriffsrechte.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q6">
                <AccordionTrigger>Wie aktuell sind die Steuer- und SV-Sätze?</AccordionTrigger>
                <AccordionContent>
                  Wir aktualisieren alle Berechnungsgrundlagen (Lohnsteuertabellen, Beitragsbemessungsgrenzen,
                  SV-Sätze) zeitnah zu jedem Jahreswechsel. Aktuell sind alle Werte für 2025 hinterlegt.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
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
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                <span className="text-sm font-bold text-primary-foreground">L</span>
              </div>
              <span className="text-sm font-medium">LohnPro</span>
            </div>
            <nav className="flex gap-6 text-sm">
              <button onClick={() => navigate("/impressum")} className="text-muted-foreground hover:text-primary transition-colors">
                Impressum
              </button>
              <button onClick={() => navigate("/datenschutz")} className="text-muted-foreground hover:text-primary transition-colors">
                Datenschutz
              </button>
              <button onClick={() => navigate("/agb")} className="text-muted-foreground hover:text-primary transition-colors">
                AGB
              </button>
               <button onClick={() => navigate("/kontakt")} className="text-muted-foreground hover:text-primary transition-colors">
                Kontakt
              </button>
              <button onClick={() => navigate("/hilfe")} className="text-muted-foreground hover:text-primary transition-colors">
                Hilfe
              </button>
              <button onClick={openCookieConsent} className="text-muted-foreground hover:text-primary transition-colors">
                Cookie-Einstellungen
              </button>
            </nav>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} LohnPro. Alle Rechte vorbehalten.
            </p>
          </div>
        </div>
      </footer>

      <CookieConsent />
    </div>
  );
}
