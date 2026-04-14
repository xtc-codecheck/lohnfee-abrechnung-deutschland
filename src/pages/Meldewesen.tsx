import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { PageSeo } from "@/components/seo/page-seo";
import { SVMeldungenPage } from "@/components/meldewesen/sv-meldungen-page";
import { BeitragsnachweisPage } from "@/components/meldewesen/beitragsnachweis-page";
import { LohnsteuerbescheinigungPage } from "@/components/meldewesen/lohnsteuerbescheinigung-page";
import { LohnsteueranmeldungPage } from "@/components/meldewesen/lohnsteueranmeldung-page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { AppBreadcrumb } from "@/components/ui/app-breadcrumb";
import { FileText, Send, ClipboardList, Calculator } from "lucide-react";
import { useNavigate } from "react-router-dom";

type MeldewesenView = 'overview' | 'sv-meldungen' | 'beitragsnachweise' | 'lstb' | 'lsta';

const viewLabels: Record<Exclude<MeldewesenView, 'overview'>, string> = {
  'sv-meldungen': 'SV-Meldungen',
  'beitragsnachweise': 'Beitragsnachweise',
  'lstb': 'Lohnsteuerbescheinigung',
  'lsta': 'Lohnsteueranmeldung',
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
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageSeo title="Meldewesen" description="SV-Meldungen, Beitragsnachweise, Lohnsteueranmeldungen und -bescheinigungen erstellen und übermitteln." path="/meldewesen" />
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Meldewesen" description="Gesetzliche Meldungen und Bescheinigungen" onBack={() => navigate("/dashboard")} />

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
        </div>
      </div>
    </MainLayout>
  );
}
