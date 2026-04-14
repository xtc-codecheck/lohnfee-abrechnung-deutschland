import { Plus, Settings, ClipboardList, Clock, Shield, Download, BookOpen, Baby, Wand2, BookOpenCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatevExportDialog } from "./datev-export-dialog";
import { PayrollEntry, PayrollPeriod } from "@/types/payroll";

interface PayrollQuickActionsProps {
  onShowSpecialPayments?: () => void;
  onShowAutomation?: () => void;
  onShowGuardian?: () => void;
  onShowLohnkonto?: () => void;
  onShowMonthlyWizard?: () => void;
  onShowFibu?: () => void;
  onShowJournal: () => void;
  onShowManual: () => void;
  onShowTimeSync: () => void;
  onShowSettings: () => void;
  onCreatePayroll: () => void;
  sortedPeriods: PayrollPeriod[];
  payrollEntries: PayrollEntry[];
}

export function PayrollQuickActions({
  onShowSpecialPayments,
  onShowAutomation,
  onShowGuardian,
  onShowLohnkonto,
  onShowMonthlyWizard,
  onShowFibu,
  onShowJournal,
  onShowManual,
  onShowTimeSync,
  onShowSettings,
  onCreatePayroll,
  sortedPeriods,
  payrollEntries,
}: PayrollQuickActionsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Geführter Wizard – prominenteste Karte */}
      <Card className="shadow-card hover:shadow-elegant transition-shadow cursor-pointer bg-gradient-to-br from-primary/10 to-accent/20 border-primary/30 md:col-span-2 lg:col-span-3" onClick={() => onShowMonthlyWizard?.()}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wand2 className="h-6 w-6 text-primary" />
            Monatsabrechnung starten
          </CardTitle>
          <CardDescription>Geführter 5-Schritt-Workflow: Zeiterfassung → Sonderzahlungen → Abrechnung → Meldungen → Export</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full bg-gradient-primary hover:opacity-90 h-11 text-base">
            <Wand2 className="h-5 w-5 mr-2" /> Wizard starten
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-card hover:shadow-elegant transition-shadow cursor-pointer" onClick={() => onShowSpecialPayments?.()}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Baby className="h-5 w-5 text-primary" />
            Spezielle Lohnarten
          </CardTitle>
          <CardDescription>Elterngeld, Kurzarbeit und Sonderleistungen</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full">Spez. Lohnarten verwalten</Button>
        </CardContent>
      </Card>

      <Card className="shadow-card hover:shadow-elegant transition-shadow cursor-pointer" onClick={() => onShowAutomation?.()}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Automatisierung
          </CardTitle>
          <CardDescription>Automatische Lohnabrechnung konfigurieren</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full">Automation-Center</Button>
        </CardContent>
      </Card>

      <Card className="shadow-card hover:shadow-elegant transition-shadow cursor-pointer bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20" onClick={() => onShowGuardian?.()}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Payroll Guardian
          </CardTitle>
          <CardDescription>KI-gestützte Anomalie-Erkennung & Prognosen</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full bg-gradient-primary hover:opacity-90">Guardian öffnen</Button>
        </CardContent>
      </Card>

      <Card className="shadow-card hover:shadow-elegant transition-shadow cursor-pointer border-accent/30" onClick={() => onShowLohnkonto?.()}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Lohnkonto
          </CardTitle>
          <CardDescription>Fortlaufendes Lohnkonto pro Mitarbeiter/Jahr (§ 41 EStG)</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full">Lohnkonto öffnen</Button>
        </CardContent>
      </Card>

      <Card className="shadow-card hover:shadow-elegant transition-shadow cursor-pointer" onClick={onShowJournal}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Lohnjournal
          </CardTitle>
          <CardDescription>Übersicht aller Lohnbuchungen und Konten</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full">Journal anzeigen</Button>
        </CardContent>
      </Card>

      <Card className="shadow-card hover:shadow-elegant transition-shadow cursor-pointer" onClick={onShowManual}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Manuelle Erfassung
          </CardTitle>
          <CardDescription>Arbeitszeiten und Zuschläge manuell eingeben</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full">Manuelle Eingabe</Button>
        </CardContent>
      </Card>

      <Card className="shadow-card hover:shadow-elegant transition-shadow cursor-pointer bg-gradient-to-br from-primary/5 to-primary/10" onClick={onShowTimeSync}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Zeiterfassung übernehmen
          </CardTitle>
          <CardDescription>Arbeitszeiten automatisch in Lohnabrechnung importieren</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full bg-gradient-primary hover:opacity-90">Zeit → Lohn Sync</Button>
        </CardContent>
      </Card>

      <Card className="shadow-card hover:shadow-elegant transition-shadow cursor-pointer border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10 dark:border-emerald-800" onClick={() => onShowFibu?.()}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpenCheck className="h-5 w-5 text-emerald-600" />
            Finanzbuchhaltung
          </CardTitle>
          <CardDescription>Automatische Buchungssätze (Soll/Haben) mit Saldenliste</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full">Fibu-Journal öffnen</Button>
        </CardContent>
      </Card>

      <Card className="shadow-card hover:shadow-elegant transition-shadow border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-purple-600" />
            DATEV Export
          </CardTitle>
          <CardDescription>Lohndaten für Steuerberater exportieren (SKR03/SKR04)</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedPeriods.length > 0 && payrollEntries.length > 0 ? (
            <DatevExportDialog
              payrollEntries={payrollEntries.filter(e => e.payrollPeriodId === sortedPeriods[0]?.id)}
              periode={sortedPeriods[0]}
            />
          ) : (
            <Button variant="outline" className="w-full" disabled>Keine Abrechnungen vorhanden</Button>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card hover:shadow-elegant transition-shadow cursor-pointer" onClick={onShowSettings}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Einstellungen
          </CardTitle>
          <CardDescription>Steuerberechnung und Parameter konfigurieren</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full">Einstellungen verwalten</Button>
        </CardContent>
      </Card>

      <Card className="shadow-card hover:shadow-elegant transition-shadow cursor-pointer" onClick={onCreatePayroll}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Neue Abrechnung
          </CardTitle>
          <CardDescription>Monatliche Lohnabrechnung erstellen</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full bg-gradient-primary hover:opacity-90">Abrechnung erstellen</Button>
        </CardContent>
      </Card>
    </div>
  );
}
