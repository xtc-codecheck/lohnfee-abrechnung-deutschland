/**
 * Fibu-Journal Komponente
 * 
 * Zeigt generierte Buchungssätze aus Lohnabrechnungen an.
 * Unterstützt SKR03/SKR04, Filterung und Saldenliste.
 */

import { useState, useMemo } from 'react';
import {
  ArrowLeft, BookOpen, Filter, Download, ChevronDown,
  CheckCircle2, AlertTriangle, Calculator, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { useEmployees } from '@/contexts/employee-context';
import { useSupabasePayroll } from '@/hooks/use-supabase-payroll';
import {
  generateFibuJournal,
  generateSaldenliste,
  FibuJournal,
  FibuBuchung,
  KontoSaldo,
  BuchungsKategorie,
} from '@/utils/fibu-booking';
import { Kontenrahmen } from '@/utils/datev-export';

interface FibuJournalPageProps {
  onBack: () => void;
}

const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

const KATEGORIE_LABELS: Record<BuchungsKategorie, string> = {
  gehalt: 'Gehalt',
  lohnsteuer: 'Lohnsteuer',
  solidaritaet: 'Soli',
  kirchensteuer: 'Kirchensteuer',
  krankenversicherung: 'KV',
  rentenversicherung: 'RV',
  arbeitslosenversicherung: 'AV',
  pflegeversicherung: 'PV',
  'ag-sv': 'AG-SV',
  nettolohn: 'Nettolohn',
  sonderzahlung: 'Sonderzahlung',
};

const KATEGORIE_COLORS: Record<BuchungsKategorie, string> = {
  gehalt: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  lohnsteuer: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  solidaritaet: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  kirchensteuer: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  krankenversicherung: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  rentenversicherung: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  arbeitslosenversicherung: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  pflegeversicherung: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'ag-sv': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  nettolohn: 'bg-primary/10 text-primary',
  sonderzahlung: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
};

const fmt = (v: number) =>
  v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function FibuJournalPage({ onBack }: FibuJournalPageProps) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [kontenrahmen, setKontenrahmen] = useState<Kontenrahmen>('SKR03');
  const [filterKategorie, setFilterKategorie] = useState<string>('all');

  const { payrollPeriods, payrollEntries } = useSupabasePayroll();

  // Finde passende Einträge für die Periode
  const periodEntries = useMemo(() => {
    return payrollEntries.filter(pe => {
      const period = payrollPeriods.find(p => p.id === pe.payrollPeriodId);
      return period && period.month === selectedMonth && period.year === selectedYear;
    });
  }, [payrollEntries, payrollPeriods, selectedMonth, selectedYear]);

  // Generiere Journal
  const journal = useMemo<FibuJournal | null>(() => {
    if (periodEntries.length === 0) return null;
    return generateFibuJournal(periodEntries, kontenrahmen, selectedMonth, selectedYear);
  }, [periodEntries, kontenrahmen, selectedMonth, selectedYear]);

  // Saldenliste
  const saldenliste = useMemo<KontoSaldo[]>(() => {
    if (!journal) return [];
    return generateSaldenliste(journal.buchungen);
  }, [journal]);

  // Gefilterte Buchungen
  const filteredBuchungen = useMemo(() => {
    if (!journal) return [];
    if (filterKategorie === 'all') return journal.buchungen;
    return journal.buchungen.filter(b => b.kategorie === filterKategorie);
  }, [journal, filterKategorie]);

  const handleExportCSV = () => {
    if (!journal) return;
    const headers = ['LfdNr', 'Datum', 'SollKonto', 'SollKontoName', 'HabenKonto', 'HabenKontoName', 'Betrag', 'Text', 'BelegNr', 'Kategorie'];
    const rows = journal.buchungen.map(b => [
      b.lfdNr, b.datum, b.sollKonto, b.sollKontoName, b.habenKonto, b.habenKontoName,
      b.betrag.toFixed(2).replace('.', ','), b.text, b.belegNr, b.kategorie,
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Fibu-Journal_${selectedMonth}_${selectedYear}_${kontenrahmen}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Finanzbuchhaltung"
        description="Automatische Buchungssätze aus Lohnabrechnungen"
        breadcrumbs={[
          { label: 'Dashboard', path: '/' },
          { label: 'Abrechnung', path: '/payroll' },
          { label: 'Finanzbuchhaltung' },
        ]}
      />

      {/* Steuerung */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={String(selectedMonth)} onValueChange={v => setSelectedMonth(Number(v))}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => (
              <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
          <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026].map(y => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={kontenrahmen} onValueChange={v => setKontenrahmen(v as Kontenrahmen)}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="SKR03">SKR03</SelectItem>
            <SelectItem value="SKR04">SKR04</SelectItem>
          </SelectContent>
        </Select>
        <HelpTooltip content="SKR03 = Prozessgliederung (Standard für KMU). SKR04 = Abschlussgliederung (international orientiert). Beide sind gleichwertig – wählen Sie den, den Ihr Steuerberater verwendet." />

        <div className="ml-auto flex gap-2">
          {journal && (
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" /> CSV-Export
            </Button>
          )}
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Zurück
          </Button>
        </div>
      </div>

      {/* Kein Journal */}
      {!journal && (
        <Card className="border-dashed">
          <CardContent className="pt-8 pb-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine Buchungen verfügbar</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Für {MONTHS[selectedMonth - 1]} {selectedYear} liegen keine Abrechnungen vor.
              Erstellen Sie zuerst eine Lohnabrechnung, dann werden die Buchungssätze automatisch generiert.
            </p>
          </CardContent>
        </Card>
      )}

      {journal && (
        <>
          {/* Übersicht */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold text-foreground">{journal.summen.anzahlBuchungen}</div>
                <div className="text-xs text-muted-foreground">Buchungssätze</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold text-foreground">{fmt(journal.summen.sollGesamt)}€</div>
                <div className="text-xs text-muted-foreground">Soll gesamt</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold text-foreground">{fmt(journal.summen.habenGesamt)}€</div>
                <div className="text-xs text-muted-foreground">Haben gesamt</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  {journal.summen.differenz === 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`text-2xl font-bold ${journal.summen.differenz === 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {fmt(journal.summen.differenz)}€
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">Differenz (Soll–Haben)</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="journal" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="journal" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Journal
              </TabsTrigger>
              <TabsTrigger value="saldenliste" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" /> Saldenliste
              </TabsTrigger>
            </TabsList>

            <TabsContent value="journal" className="space-y-4">
              {/* Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterKategorie} onValueChange={setFilterKategorie}>
                  <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Kategorien</SelectItem>
                    {Object.entries(KATEGORIE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                  {filteredBuchungen.length} Buchung{filteredBuchungen.length !== 1 ? 'en' : ''}
                </span>
              </div>

              {/* Buchungstabelle */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Nr.</TableHead>
                          <TableHead>Soll</TableHead>
                          <TableHead>Haben</TableHead>
                          <TableHead className="text-right">Betrag</TableHead>
                          <TableHead>Text</TableHead>
                          <TableHead>Kategorie</TableHead>
                          <TableHead>Beleg</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBuchungen.map(b => (
                          <TableRow key={b.id}>
                            <TableCell className="font-mono text-sm">{b.lfdNr}</TableCell>
                            <TableCell>
                              <div className="font-mono text-sm">{b.sollKonto}</div>
                              <div className="text-xs text-muted-foreground">{b.sollKontoName}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-mono text-sm">{b.habenKonto}</div>
                              <div className="text-xs text-muted-foreground">{b.habenKontoName}</div>
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              {fmt(b.betrag)}€
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-sm">{b.text}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={KATEGORIE_COLORS[b.kategorie]}>
                                {KATEGORIE_LABELS[b.kategorie]}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{b.belegNr}</TableCell>
                          </TableRow>
                        ))}
                        {filteredBuchungen.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              Keine Buchungen für den gewählten Filter
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Journal-Summen */}
              <Card className="bg-muted/30">
                <CardContent className="pt-4 pb-4">
                  <div className="grid grid-cols-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Summe Soll:</span>{' '}
                      <span className="font-bold">{fmt(journal.summen.sollGesamt)}€</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Summe Haben:</span>{' '}
                      <span className="font-bold">{fmt(journal.summen.habenGesamt)}€</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Differenz:</span>{' '}
                      <span className={`font-bold ${journal.summen.differenz === 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {fmt(journal.summen.differenz)}€
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="saldenliste" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    Saldenliste {MONTHS[selectedMonth - 1]} {selectedYear}
                    <HelpTooltip content="Zeigt die Summe aller Soll- und Haben-Buchungen pro Konto. Aufwandskonten haben einen Soll-Saldo, Verbindlichkeitskonten einen Haben-Saldo." />
                  </CardTitle>
                  <CardDescription>Kontenrahmen {kontenrahmen} · {saldenliste.length} Konten</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Konto</TableHead>
                          <TableHead>Bezeichnung</TableHead>
                          <TableHead className="text-right">Soll</TableHead>
                          <TableHead className="text-right">Haben</TableHead>
                          <TableHead className="text-right">Saldo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {saldenliste.map(s => (
                          <TableRow key={s.konto}>
                            <TableCell className="font-mono font-medium">{s.konto}</TableCell>
                            <TableCell>{s.name}</TableCell>
                            <TableCell className="text-right font-mono">
                              {s.soll > 0 ? `${fmt(s.soll)}€` : '–'}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {s.haben > 0 ? `${fmt(s.haben)}€` : '–'}
                            </TableCell>
                            <TableCell className={`text-right font-mono font-medium ${s.saldo > 0 ? 'text-foreground' : s.saldo < 0 ? 'text-muted-foreground' : ''}`}>
                              {fmt(Math.abs(s.saldo))}€ {s.saldo > 0 ? 'S' : s.saldo < 0 ? 'H' : ''}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
