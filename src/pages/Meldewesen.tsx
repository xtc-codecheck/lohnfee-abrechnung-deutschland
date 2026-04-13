import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { SVMeldungenPage } from "@/components/meldewesen/sv-meldungen-page";
import { BeitragsnachweisPage } from "@/components/meldewesen/beitragsnachweis-page";
import { LohnsteuerbescheinigungPage } from "@/components/meldewesen/lohnsteuerbescheinigung-page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { FileText, Send, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";

type MeldewesenView = 'overview' | 'sv-meldungen' | 'beitragsnachweise' | 'lstb';

export default function Meldewesen() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<MeldewesenView>('overview');

  if (currentView === 'sv-meldungen') {
    return <MainLayout><SVMeldungenPage onBack={() => setCurrentView('overview')} /></MainLayout>;
  }
  if (currentView === 'beitragsnachweise') {
    return <MainLayout><BeitragsnachweisPage onBack={() => setCurrentView('overview')} /></MainLayout>;
  }
  if (currentView === 'lstb') {
    return <MainLayout><LohnsteuerbescheinigungPage onBack={() => setCurrentView('overview')} /></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Meldewesen" description="Gesetzliche Meldungen und Bescheinigungen" onBack={() => navigate("/dashboard")} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
