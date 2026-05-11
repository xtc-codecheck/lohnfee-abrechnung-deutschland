import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { PageSeo } from "@/components/seo/page-seo";
import { SVMeldungenPage } from "@/components/meldewesen/sv-meldungen-page";
import { BeitragsnachweisPage } from "@/components/meldewesen/beitragsnachweis-page";
import { LohnsteuerbescheinigungPage } from "@/components/meldewesen/lohnsteuerbescheinigung-page";
import { LohnsteueranmeldungPage } from "@/components/meldewesen/lohnsteueranmeldung-page";
import { AagPage } from "@/components/meldewesen/aag-page";
import { SofortmeldungPage } from "@/components/meldewesen/sofortmeldung-page";
import { UvJahresmeldungPage } from "@/components/meldewesen/uv-jahresmeldung-page";
import { BescheinigungenPage } from "@/components/meldewesen/bescheinigungen-page";
import { DeuevRueckmeldungenPage } from "@/components/meldewesen/deuev-rueckmeldungen-page";
import { ElstamChangesPage } from "@/components/meldewesen/elstam-changes-page";
import { ZvkPage } from "@/components/meldewesen/zvk-page";
import { ExportCenter } from "@/components/meldewesen/export-center";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { AppBreadcrumb } from "@/components/ui/app-breadcrumb";
import { FileText, Send, ClipboardList, Calculator, HeartPulse, Zap, Shield, FileSignature, Inbox, Building2, Plane, Scale, Package, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

type MeldewesenView = 'overview' | 'sv-meldungen' | 'beitragsnachweise' | 'lstb' | 'lsta' | 'aag' | 'sofortmeldung' | 'uv-jahr' | 'bescheinigungen' | 'deuev-rueck' | 'elstam-changes' | 'zvk' | 'export-center';

const viewLabels: Record<Exclude<MeldewesenView, 'overview'>, string> = {
  'sv-meldungen': 'SV-Meldungen',
  'beitragsnachweise': 'Beitragsnachweise',
  'lstb': 'Lohnsteuerbescheinigung',
  'lsta': 'Lohnsteueranmeldung',
  'aag': 'AAG U1/U2',
  'sofortmeldung': 'Sofortmeldung § 28a',
  'uv-jahr': 'UV-Jahresmeldung',
  'bescheinigungen': 'Bescheinigungen (EEL/BEA)',
  'deuev-rueck': 'DEÜV-Rückmeldungen',
  'elstam-changes': 'ELStAM-Änderungen',
  'zvk': 'ZVK / Pensionskassen',
  'export-center': 'Export-Center',
};

export default function Meldewesen() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<MeldewesenView>('overview');

  if (currentView !== 'overview') {
    const subBreadcrumbs = [
      { label: "Meldewesen", path: "/meldewesen" },
      { label: viewLabels[currentView] },
    ];

    const handleBack = () => setCurrentView('overview');

    return (
      <MainLayout>
        <AppBreadcrumb segments={subBreadcrumbs} />
        {currentView === 'sv-meldungen' && <SVMeldungenPage onBack={handleBack} />}
        {currentView === 'beitragsnachweise' && <BeitragsnachweisPage onBack={handleBack} />}
        {currentView === 'lstb' && <LohnsteuerbescheinigungPage onBack={handleBack} />}
        {currentView === 'lsta' && <LohnsteueranmeldungPage onBack={handleBack} />}
        {currentView === 'aag' && <AagPage onBack={handleBack} />}
        {currentView === 'sofortmeldung' && <SofortmeldungPage onBack={handleBack} />}
        {currentView === 'uv-jahr' && <UvJahresmeldungPage onBack={handleBack} />}
        {currentView === 'bescheinigungen' && <BescheinigungenPage onBack={handleBack} />}
        {currentView === 'deuev-rueck' && <DeuevRueckmeldungenPage onBack={handleBack} />}
        {currentView === 'elstam-changes' && <ElstamChangesPage onBack={handleBack} />}
        {currentView === 'zvk' && <ZvkPage onBack={handleBack} />}
        {currentView === 'export-center' && <ExportCenter onBack={handleBack} />}
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageSeo title="Meldewesen" description="SV-Meldungen, Beitragsnachweise, Lohnsteueranmeldungen und -bescheinigungen erstellen und übermitteln." path="/meldewesen" />
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Meldewesen" description="Gesetzliche Meldungen und Bescheinigungen" onBack={() => navigate("/dashboard")} />

        <Card className="shadow-elegant border-primary/40 bg-primary/5 cursor-pointer hover:shadow-elegant transition-shadow"
              onClick={() => setCurrentView('export-center')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Package className="h-5 w-5" />
              Export-Center · Alle Meldungen eines Monats als ZIP
            </CardTitle>
            <CardDescription>
              Ein Klick = ZIP-Bundle mit Lohnsteueranmeldung, Beitragsnachweisen, DEÜV-Meldungen, AAG, UV
              und Anleitung für sv.net Classic / Mein ELSTER / BG-Portal. Empfohlen für Unternehmer ohne Steuerberater.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Export-Center öffnen</Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-card hover:shadow-elegant transition-shadow cursor-pointer" onClick={() => setCurrentView('sv-meldungen')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                SV-Meldungen
              </CardTitle>
              <CardDescription>
                An-/Abmeldungen, Jahresmeldungen (DEÜV) an Krankenkassen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Meldungen verwalten</Button>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-elegant transition-shadow cursor-pointer" onClick={() => setCurrentView('beitragsnachweise')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Beitragsnachweise
              </CardTitle>
              <CardDescription>
                Monatliche Beitragsnachweise an Krankenkassen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Nachweise generieren</Button>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-elegant transition-shadow cursor-pointer" onClick={() => setCurrentView('lsta')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Lohnsteueranmeldung
              </CardTitle>
              <CardDescription>
                Monatliche LSt-Anmeldung gem. § 41a EStG (ELSTER)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Anmeldungen erstellen</Button>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-elegant transition-shadow cursor-pointer" onClick={() => setCurrentView('lstb')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Lohnsteuerbescheinigung
              </CardTitle>
              <CardDescription>
                Elektronische Lohnsteuerbescheinigung (eLStB) gem. § 41b EStG
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Bescheinigungen erstellen</Button>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-elegant transition-shadow cursor-pointer" onClick={() => setCurrentView('aag')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-primary" />
                AAG-Erstattung U1/U2
              </CardTitle>
              <CardDescription>
                Erstattungsanträge bei Krankheit (U1) und Mutterschaft (U2)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Anträge verwalten</Button>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-elegant transition-shadow cursor-pointer" onClick={() => setCurrentView('sofortmeldung')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Sofortmeldung § 28a SGB IV
              </CardTitle>
              <CardDescription>
                Pflichtmeldung bei Beschäftigungsbeginn (Bau, Gastro, Spedition u. a.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Meldungen verwalten</Button>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-elegant transition-shadow cursor-pointer" onClick={() => setCurrentView('uv-jahr')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                UV-Jahresmeldung (BG)
              </CardTitle>
              <CardDescription>
                Digitaler Lohnnachweis (DSLN) an die Berufsgenossenschaft – Frist 16.02.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Lohnnachweis erstellen</Button>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-elegant transition-shadow cursor-pointer" onClick={() => setCurrentView('bescheinigungen')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-primary" />
                Bescheinigungen (EEL & BEA)
              </CardTitle>
              <CardDescription>
                Krankengeld, Mutterschaft, Verletztengeld, Arbeitslosengeld
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Bescheinigungen verwalten</Button>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-elegant transition-shadow cursor-pointer" onClick={() => setCurrentView('deuev-rueck')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="h-5 w-5 text-primary" />
                DEÜV-Rückmeldungen
              </CardTitle>
              <CardDescription>
                Antworten der Krankenkassen einlesen und Status zuordnen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Inbox öffnen</Button>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-elegant transition-shadow cursor-pointer" onClick={() => setCurrentView('elstam-changes')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                ELStAM-Änderungen
              </CardTitle>
              <CardDescription>
                Änderungen an Steuerklasse, KiSt &amp; Kinderfreibetrag mit Korrekturhinweis (§ 41c EStG)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Inbox öffnen</Button>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-elegant transition-shadow cursor-pointer" onClick={() => setCurrentView('zvk')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                ZVK / Pensionskassen
              </CardTitle>
              <CardDescription>
                Beitrags- und Jahresmeldungen außerhalb SOKA-BAU
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Kassen verwalten</Button>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-elegant transition-shadow cursor-pointer" onClick={() => navigate('/a1')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5 text-primary" />
                A1-Bescheinigung
              </CardTitle>
              <CardDescription>
                Entsendung in EU/EWR/Schweiz – VO (EG) 883/2004
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">A1-Anträge verwalten</Button>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-elegant transition-shadow cursor-pointer" onClick={() => navigate('/kug')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Kurzarbeitergeld (KUG)
              </CardTitle>
              <CardDescription>
                Anzeige Arbeitsausfall und Leistungsantrag § 95 ff. SGB III
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">KUG-Anträge verwalten</Button>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-elegant transition-shadow cursor-pointer" onClick={() => navigate('/pfaendungen')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                Pfändungsverwaltung
              </CardTitle>
              <CardDescription>
                Lohnpfändungen mit Rangfolge, Pfändungsrechner 2026
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Pfändungen verwalten</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
