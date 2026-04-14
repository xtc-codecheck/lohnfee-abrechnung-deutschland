import { useState } from "react";
import { PageSeo } from "@/components/seo/page-seo";
import { LegalLayout } from "@/components/layout/legal-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Search, Users, Calculator, Clock, FileText, Settings, Shield,
  BookOpen, Video, HelpCircle, ArrowLeft, ChevronRight, Lightbulb,
  CheckCircle, AlertTriangle
} from "lucide-react";

const categories = [
  {
    id: "erste-schritte",
    title: "Erste Schritte",
    icon: Lightbulb,
    color: "text-amber-500",
    articles: [
      {
        title: "Konto erstellen & einrichten",
        content: "Registrieren Sie sich mit Ihrer E-Mail-Adresse und bestätigen Sie diese. Nach der Anmeldung werden Sie durch den Einrichtungsassistenten geführt, in dem Sie Ihre Firmendaten, Betriebsnummer und Finanzamtinformationen hinterlegen.",
        tags: ["Registrierung", "Setup"],
      },
      {
        title: "Mandanten anlegen & verwalten",
        content: "Unter Einstellungen → Mandanten können Sie neue Mandanten anlegen. Jeder Mandant hat eigene Mitarbeiter, Abrechnungen und Einstellungen. Wechseln Sie über den Mandanten-Switcher in der Kopfzeile zwischen Ihren Mandanten.",
        tags: ["Mandanten", "Multi-Tenant"],
      },
      {
        title: "Benutzerrollen verstehen",
        content: "Es gibt drei Rollen: Admin (voller Zugriff), Sachbearbeiter (Abrechnungen erstellen & bearbeiten) und Leserecht (nur Ansicht). Rollen werden pro Mandant vergeben und können unter Einstellungen → Benutzerverwaltung angepasst werden.",
        tags: ["Rollen", "Berechtigungen"],
      },
    ],
  },
  {
    id: "mitarbeiter",
    title: "Mitarbeiterverwaltung",
    icon: Users,
    color: "text-blue-500",
    articles: [
      {
        title: "Neuen Mitarbeiter anlegen",
        content: "Navigieren Sie zu Mitarbeiter → Neuer Mitarbeiter. Der Assistent führt Sie durch vier Schritte: Persönliche Daten, Beschäftigungsdaten, Gehaltsdaten und Zusatzleistungen. Pflichtfelder sind Vorname, Nachname, Steuerklasse und Bruttogehalt.",
        tags: ["Mitarbeiter", "Anlegen"],
      },
      {
        title: "Mitarbeiterdaten bearbeiten",
        content: "Klicken Sie in der Mitarbeiterliste auf den gewünschten Mitarbeiter und dann auf 'Bearbeiten'. Änderungen an steuerrelevanten Daten (Steuerklasse, Kirchensteuer) werden im Audit-Log protokolliert und wirken sich auf die nächste Abrechnung aus.",
        tags: ["Bearbeiten", "Stammdaten"],
      },
      {
        title: "Mitarbeiter deaktivieren / Austritt",
        content: "Setzen Sie das Austrittsdatum im Mitarbeiterprofil. Der Mitarbeiter wird automatisch als inaktiv markiert und erscheint nicht mehr in neuen Abrechnungen. Die historischen Daten bleiben erhalten.",
        tags: ["Austritt", "Deaktivieren"],
      },
    ],
  },
  {
    id: "abrechnung",
    title: "Lohnabrechnung",
    icon: Calculator,
    color: "text-green-500",
    articles: [
      {
        title: "Monatliche Abrechnung erstellen",
        content: "Gehen Sie zu Abrechnung → Neue Periode erstellen. Wählen Sie Monat und Jahr. Das System berechnet automatisch Lohnsteuer, Solidaritätszuschlag, Kirchensteuer sowie alle Sozialversicherungsbeiträge (KV, RV, AV, PV) für jeden aktiven Mitarbeiter.",
        tags: ["Abrechnung", "Monatlich"],
      },
      {
        title: "Sonderzahlungen verwalten",
        content: "Unter Abrechnung → Sonderzahlungen können Sie Weihnachtsgeld, Urlaubsgeld, Prämien oder einmalige Zulagen erfassen. Das System wendet automatisch die korrekte Steuerberechnung (Fünftelregelung bei Abfindungen) an.",
        tags: ["Sonderzahlungen", "Bonus"],
      },
      {
        title: "DATEV-Export durchführen",
        content: "Nach Abschluss einer Abrechnungsperiode können Sie unter Abrechnung → DATEV-Export die Buchungssätze im DATEV-Format exportieren. Unterstützt werden die Formate ASCII und CSV für die Übernahme in DATEV Kanzlei-Rechnungswesen.",
        tags: ["DATEV", "Export"],
      },
      {
        title: "Lohnkonto & Journal einsehen",
        content: "Das Lohnkonto zeigt alle Abrechnungen eines Mitarbeiters chronologisch. Das Lohnjournal bietet eine Übersicht aller Abrechnungen einer Periode mit Summen und Durchschnittswerten.",
        tags: ["Lohnkonto", "Journal"],
      },
    ],
  },
  {
    id: "zeiterfassung",
    title: "Zeiterfassung",
    icon: Clock,
    color: "text-purple-500",
    articles: [
      {
        title: "Arbeitszeiten erfassen",
        content: "Unter Zeiterfassung können Sie für jeden Mitarbeiter Arbeitszeiten mit Start, Ende und Pausenzeiten erfassen. Die Arbeitsstunden werden automatisch berechnet. Nutzen Sie die Massenerfassung für mehrere Mitarbeiter gleichzeitig.",
        tags: ["Zeiterfassung", "Arbeitszeit"],
      },
      {
        title: "Abwesenheiten verwalten",
        content: "Erfassen Sie Urlaub, Krankheit, Feiertage und sonstige Abwesenheiten im Kalender. Das System prüft automatisch Urlaubsansprüche und warnt bei Überschreitungen.",
        tags: ["Urlaub", "Krankheit"],
      },
      {
        title: "Arbeitszeitkonten",
        content: "Arbeitszeitkonten zeigen den Saldo zwischen Soll- und Ist-Arbeitszeit. Überstunden und Minusstunden werden automatisch berechnet und können in die Lohnabrechnung übernommen werden.",
        tags: ["Arbeitszeitkonto", "Überstunden"],
      },
    ],
  },
  {
    id: "meldewesen",
    title: "Meldewesen",
    icon: FileText,
    color: "text-orange-500",
    articles: [
      {
        title: "SV-Meldungen erstellen",
        content: "Sozialversicherungsmeldungen (Anmeldung, Abmeldung, Jahresmeldung) werden unter Meldewesen → SV-Meldungen erstellt. Wählen Sie den Mitarbeiter, den Meldegrund und den Zeitraum. Das System füllt automatisch Beitragsgruppe und Personengruppe aus.",
        tags: ["SV-Meldung", "Sozialversicherung"],
      },
      {
        title: "Beitragsnachweise generieren",
        content: "Beitragsnachweise für Krankenkassen werden unter Meldewesen → Beitragsnachweise erstellt. Wählen Sie Monat, Jahr und Krankenkasse. Alle Beitragsanteile (AG/AN) werden automatisch berechnet.",
        tags: ["Beitragsnachweis", "Krankenkasse"],
      },
      {
        title: "Lohnsteuerbescheinigung",
        content: "Am Jahresende oder bei Austritt eines Mitarbeiters erstellen Sie die elektronische Lohnsteuerbescheinigung unter Meldewesen → Lohnsteuerbescheinigung. Alle Zeilen werden automatisch aus den Abrechnungsdaten befüllt.",
        tags: ["Lohnsteuerbescheinigung", "ELStAM"],
      },
    ],
  },
  {
    id: "einstellungen",
    title: "Einstellungen & Sicherheit",
    icon: Settings,
    color: "text-slate-500",
    articles: [
      {
        title: "Firmendaten pflegen",
        content: "Unter Einstellungen → Firmendaten hinterlegen Sie Name, Adresse, Betriebsnummer, Steuernummer und Bankverbindung Ihres Unternehmens. Diese Daten erscheinen auf Lohnabrechnungen und Meldungen.",
        tags: ["Firmendaten", "Stammdaten"],
      },
      {
        title: "DSGVO & Datenschutz",
        content: "LohnPro bietet integriertes DSGVO-Management: Auskunfts-, Lösch- und Berichtigungsanfragen können unter Einstellungen → DSGVO verwaltet werden. Aufbewahrungsfristen werden automatisch überwacht.",
        tags: ["DSGVO", "Datenschutz"],
      },
      {
        title: "Compliance-Prüfungen",
        content: "Das System führt automatische Compliance-Prüfungen durch: Mindestlohn-Kontrolle, Arbeitszeitgesetz-Prüfung, Fristenüberwachung für Meldungen und Sozialversicherungsprüfungen. Warnungen erscheinen im Dashboard.",
        tags: ["Compliance", "Prüfung"],
      },
    ],
  },
];

const faqs = [
  {
    question: "Wie ändere ich die Steuerklasse eines Mitarbeiters?",
    answer: "Gehen Sie zu Mitarbeiter → gewünschten Mitarbeiter auswählen → Bearbeiten → Gehaltsdaten. Ändern Sie die Steuerklasse und speichern Sie. Die Änderung gilt ab der nächsten Abrechnung.",
  },
  {
    question: "Kann ich eine bereits abgeschlossene Abrechnung korrigieren?",
    answer: "Ja, erstellen Sie eine Korrekturabrechnung für die betroffene Periode. Das System berechnet die Differenzen automatisch und berücksichtigt diese in der nächsten regulären Abrechnung.",
  },
  {
    question: "Wie exportiere ich Daten für meinen Steuerberater?",
    answer: "Nutzen Sie den DATEV-Export unter Abrechnung → DATEV-Export. Wählen Sie die gewünschte Periode und das Format. Die exportierte Datei kann direkt in DATEV-Software importiert werden.",
  },
  {
    question: "Was passiert mit den Daten bei Mandantenwechsel?",
    answer: "Jeder Mandant hat vollständig getrennte Daten. Beim Wechsel über den Mandanten-Switcher sehen Sie nur die Daten des ausgewählten Mandanten. Es gibt keine Datenvermischung.",
  },
  {
    question: "Wie sichere ich meine Daten?",
    answer: "Alle Daten werden automatisch in der Cloud gesichert und verschlüsselt gespeichert. Zusätzlich können Sie unter Berichte → Export jederzeit vollständige Datenexporte erstellen.",
  },
  {
    question: "Unterstützt LohnPro Branchenlösungen?",
    answer: "Ja, LohnPro bietet spezielle Module für Bau (Baulohn mit Sozialkassen), Gastronomie (Trinkgeldabrechnung) und Pflege (Schichtzulagen). Diese werden unter Abrechnung → Branchenmodule aktiviert.",
  },
];

export default function HilfeCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const navigate = useNavigate();

  const filteredCategories = categories.map((cat) => ({
    ...cat,
    articles: cat.articles.filter(
      (a) =>
        !searchQuery ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
  })).filter((cat) => cat.articles.length > 0);

  const filteredFaqs = faqs.filter(
    (f) =>
      !searchQuery ||
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalArticles = categories.reduce((sum, c) => sum + c.articles.length, 0);

  const activeCategory = selectedCategory
    ? filteredCategories.find((c) => c.id === selectedCategory)
    : null;

  return (
    <LegalLayout>
      <PageSeo
        title="Hilfe-Center | LohnPro"
        description="Anleitungen, Tutorials und FAQ für LohnPro – Ihre Lohnabrechnungssoftware. Finden Sie Antworten auf häufige Fragen."
        path="/hilfe"
      />

      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 py-12">

          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-4">
              <BookOpen className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Hilfe-Center
            </h1>
            <p className="text-muted-foreground text-lg mb-6">
              {totalArticles} Anleitungen in {categories.length} Kategorien
            </p>

            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Artikel, Themen oder Fragen suchen…"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedCategory(null);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-10">
        {/* Category detail view */}
        {activeCategory && !searchQuery ? (
          <div className="max-w-3xl mx-auto">
            <Button
              variant="ghost"
              size="sm"
              className="mb-6"
              onClick={() => setSelectedCategory(null)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Alle Kategorien
            </Button>

            <div className="flex items-center gap-3 mb-6">
              <activeCategory.icon className={`h-6 w-6 ${activeCategory.color}`} />
              <h2 className="text-2xl font-bold text-foreground">{activeCategory.title}</h2>
              <Badge variant="secondary">{activeCategory.articles.length} Artikel</Badge>
            </div>

            <div className="space-y-4">
              {activeCategory.articles.map((article, i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      {article.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed mb-3">{article.content}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {article.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Category grid */}
            {!searchQuery && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                {categories.map((cat) => (
                  <Card
                    key={cat.id}
                    className="cursor-pointer hover:shadow-md transition-shadow group"
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <cat.icon className={`h-5 w-5 ${cat.color}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{cat.title}</h3>
                            <p className="text-sm text-muted-foreground">{cat.articles.length} Artikel</p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Search results */}
            {searchQuery && (
              <div className="max-w-3xl mx-auto mb-12">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  {filteredCategories.reduce((s, c) => s + c.articles.length, 0)} Ergebnisse für „{searchQuery}"
                </h2>
                {filteredCategories.map((cat) => (
                  <div key={cat.id} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <cat.icon className={`h-4 w-4 ${cat.color}`} />
                      <h3 className="font-medium text-foreground">{cat.title}</h3>
                    </div>
                    <div className="space-y-3">
                      {cat.articles.map((article, i) => (
                        <Card key={i}>
                          <CardContent className="p-4">
                            <h4 className="font-medium text-foreground mb-1">{article.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">{article.content}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredCategories.length === 0 && filteredFaqs.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Keine Ergebnisse gefunden. Versuchen Sie einen anderen Suchbegriff.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* FAQ Section */}
            {filteredFaqs.length > 0 && (
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                  <HelpCircle className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">Häufige Fragen</h2>
                </div>
                <Accordion type="multiple" className="space-y-2">
                  {filteredFaqs.map((faq, i) => (
                    <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4">
                      <AccordionTrigger className="text-left font-medium">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {/* Contact CTA */}
            {!searchQuery && (
              <div className="max-w-3xl mx-auto mt-12">
                <Card className="bg-muted/30 border-border/60">
                  <CardContent className="p-8 text-center">
                    <Shield className="h-10 w-10 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Frage nicht beantwortet?
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Kontaktieren Sie unser Support-Team – wir helfen Ihnen gerne weiter.
                    </p>
                    <Button onClick={() => navigate("/kontakt")}>
                      Kontakt aufnehmen
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </LegalLayout>
  );
}
