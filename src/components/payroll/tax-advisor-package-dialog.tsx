/**
 * Steuerberater-Paket Dialog
 *
 * One-Click-Export: erzeugt ein ZIP mit DATEV CSV, FiBu-Journal,
 * Lohnarten-Excel und Begleit-PDF für die Übergabe an den Steuerberater.
 */

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  Download,
  FileArchive,
  FileSpreadsheet,
  FileText,
  BookOpen,
  Loader2,
  Building2,
  Calculator,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { PayrollEntry, PayrollPeriod } from '@/types/payroll';
import {
  generateTaxAdvisorPackage,
  downloadTaxAdvisorPackage,
} from '@/utils/tax-advisor-package';
import type { Kontenrahmen } from '@/utils/datev-export';
import { generateFibuJournal } from '@/utils/fibu-booking';
import { useCompanySettings } from '@/hooks/use-company-settings';
import { useTenant } from '@/contexts/tenant-context';

interface TaxAdvisorPackageDialogProps {
  payrollEntries: PayrollEntry[];
  periode: PayrollPeriod;
  trigger?: React.ReactNode;
  onExportComplete?: () => void;
  /**
   * Optional: alle verfügbaren Perioden für Dropdown-Auswahl.
   * Wenn angegeben (zusammen mit `allEntries`), kann der User die Periode wechseln.
   */
  allPeriods?: PayrollPeriod[];
  /** Optional: alle Payroll-Entries (über alle Perioden) für die Dropdown-Auswahl. */
  allEntries?: PayrollEntry[];
}

type CheckStatus = 'ok' | 'warn' | 'error';

interface ValidationCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  blocking: boolean;
}

export function TaxAdvisorPackageDialog({
  payrollEntries,
  periode,
  trigger,
  onExportComplete,
  allPeriods,
  allEntries,
}: TaxAdvisorPackageDialogProps) {
  const { settings: companySettings } = useCompanySettings();
  const { tenantId } = useTenant();
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [kontenrahmen, setKontenrahmen] = useState<Kontenrahmen>('SKR03');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(periode.id);
  const [periodPickerOpen, setPeriodPickerOpen] = useState(false);

  // Periode + zugehörige Einträge aus Dropdown ableiten (Fallback: Props)
  const { periodOptions, hiddenPeriodsCount } = useMemo(() => {
    const list = allPeriods && allPeriods.length > 0 ? allPeriods : [periode];

    // Set der Perioden-IDs mit mindestens einer Abrechnung
    const entriesPool =
      allEntries && allEntries.length > 0 ? allEntries : payrollEntries;
    const periodsWithEntries = new Set(entriesPool.map((e) => e.payrollPeriodId));

    // Nur Perioden mit Abrechnungen behalten; aktuelle Prop-Periode immer beibehalten,
    // damit der Dialog niemals leer/ungültig wird.
    const filtered = list.filter(
      (p) => periodsWithEntries.has(p.id) || p.id === periode.id,
    );
    const hidden = list.length - filtered.length;

    return {
      periodOptions: filtered.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      }),
      hiddenPeriodsCount: hidden,
    };
  }, [allPeriods, allEntries, payrollEntries, periode]);

  // ─── Persistenz: zuletzt gewählte Periode pro Mandant ────────
  const storageKey = tenantId ? `tax-advisor-pkg:last-period:${tenantId}` : null;

  // Beim Öffnen: gespeicherte Periode (year-month) auf eine vorhandene ID mappen.
  useEffect(() => {
    if (!open || !storageKey) return;
    try {
      const stored = localStorage.getItem(storageKey); // Format: "YYYY-MM"
      if (!stored) return;
      const match = periodOptions.find(
        (p) => `${p.year}-${String(p.month).padStart(2, '0')}` === stored,
      );
      if (match && match.id !== selectedPeriodId) {
        setSelectedPeriodId(match.id);
      }
    } catch {
      /* localStorage nicht verfügbar – ignorieren */
    }
    // Nur beim Öffnen anwenden, nicht bei jeder periodOptions-Änderung.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, storageKey]);

  // Auswahl persistieren (nutzt year-month statt DB-ID, damit es Mandant-übergreifend stabil ist)
  const handlePeriodChange = (id: string) => {
    setSelectedPeriodId(id);
    setPeriodPickerOpen(false);
    if (!storageKey) return;
    const next = periodOptions.find((p) => p.id === id);
    if (!next) return;
    try {
      localStorage.setItem(
        storageKey,
        `${next.year}-${String(next.month).padStart(2, '0')}`,
      );
    } catch {
      /* ignorieren */
    }
  };

  const activePeriod: PayrollPeriod =
    periodOptions.find((p) => p.id === selectedPeriodId) ?? periode;

  const activeEntries: PayrollEntry[] = useMemo(() => {
    if (allEntries && allEntries.length > 0) {
      return allEntries.filter((e) => e.payrollPeriodId === activePeriod.id);
    }
    // Fallback: Wenn keine globale Liste übergeben wurde, nur die ursprünglichen Entries verwenden,
    // sofern sie zur aktiven Periode passen.
    return payrollEntries.filter((e) => e.payrollPeriodId === activePeriod.id);
  }, [allEntries, payrollEntries, activePeriod.id]);

  const companyName = companySettings?.company_name ?? 'Mandant';
  const companyAddress = [
    companySettings?.street,
    [companySettings?.zip_code, companySettings?.city].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ');

  const stats = {
    employees: activeEntries.length,
    brutto: activeEntries.reduce((s, e) => s + e.salaryCalculation.grossSalary, 0),
    netto: activeEntries.reduce((s, e) => s + e.finalNetSalary, 0),
  };

  // ─── Validierung: Pflichtdaten vor Export ────────────────────
  const validation = useMemo(() => {
    const checks: ValidationCheck[] = [];

    // 1) Abrechnungen vorhanden?
    if (activeEntries.length === 0) {
      checks.push({
        id: 'entries',
        label: 'Lohnabrechnungen vorhanden',
        status: 'error',
        detail: 'Für diesen Monat existieren keine Abrechnungen.',
        blocking: true,
      });
    } else {
      checks.push({
        id: 'entries',
        label: 'Lohnabrechnungen vorhanden',
        status: 'ok',
        detail: `${activeEntries.length} Mitarbeiter abgerechnet.`,
        blocking: true,
      });
    }

    // 2) Periode-Status (gebucht / abgeschlossen?)
    const periodStatus = (activePeriod.status ?? 'draft').toLowerCase();
    const periodClosed = ['closed', 'completed', 'processed', 'abgeschlossen'].includes(
      periodStatus,
    );
    checks.push({
      id: 'period',
      label: 'Abrechnungsperiode abgeschlossen',
      status: periodClosed ? 'ok' : 'warn',
      detail: periodClosed
        ? `Periode ${format(activePeriod.startDate, 'MM/yyyy')} ist abgeschlossen.`
        : `Periode hat Status "${periodStatus}". Export ist möglich, aber Daten könnten sich noch ändern.`,
      blocking: false,
    });

    // 3) Lohnarten-Aufschlüsselung
    const entriesWithLineItems = activeEntries.filter(
      (e) => (e.wageTypeLineItems ?? []).length > 0,
    );
    const lineItemRatio = activeEntries.length
      ? entriesWithLineItems.length / activeEntries.length
      : 0;
    if (activeEntries.length === 0) {
      // bereits durch Check 1 abgedeckt
    } else if (lineItemRatio === 1) {
      checks.push({
        id: 'wagetypes',
        label: 'Lohnarten-Aufschlüsselung vollständig',
        status: 'ok',
        detail: 'Alle Mitarbeiter haben detaillierte Lohnarten-Buchungen.',
        blocking: false,
      });
    } else if (lineItemRatio > 0) {
      checks.push({
        id: 'wagetypes',
        label: 'Lohnarten-Aufschlüsselung vollständig',
        status: 'warn',
        detail: `${entriesWithLineItems.length}/${activeEntries.length} Mitarbeiter haben Lohnarten-Details. Sammelbuchungen werden für die Übrigen verwendet.`,
        blocking: false,
      });
    } else {
      checks.push({
        id: 'wagetypes',
        label: 'Lohnarten-Aufschlüsselung vollständig',
        status: 'warn',
        detail: 'Keine Lohnarten-Details. Es werden nur Sammelbuchungen erzeugt.',
        blocking: false,
      });
    }

    // 4) Kontenrahmen-Konten in Wage-Types gepflegt?
    const accountField = kontenrahmen === 'SKR03' ? 'account_skr03' : 'account_skr04';
    let totalLineItems = 0;
    let lineItemsWithAccount = 0;
    for (const e of activeEntries) {
      for (const li of e.wageTypeLineItems ?? []) {
        totalLineItems++;
        if (li.account && String(li.account).trim().length > 0) lineItemsWithAccount++;
      }
    }
    if (totalLineItems === 0) {
      checks.push({
        id: 'accounts',
        label: `${kontenrahmen}-Konten gepflegt`,
        status: 'warn',
        detail: 'Keine Lohnarten zur Kontenprüfung vorhanden – Standardkonten werden verwendet.',
        blocking: false,
      });
    } else if (lineItemsWithAccount === totalLineItems) {
      checks.push({
        id: 'accounts',
        label: `${kontenrahmen}-Konten gepflegt`,
        status: 'ok',
        detail: `Alle ${totalLineItems} Lohnart-Buchungen haben ein ${kontenrahmen}-Konto.`,
        blocking: false,
      });
    } else {
      checks.push({
        id: 'accounts',
        label: `${kontenrahmen}-Konten gepflegt`,
        status: 'warn',
        detail: `${totalLineItems - lineItemsWithAccount} von ${totalLineItems} Lohnart-Buchungen ohne ${kontenrahmen}-Konto. Standardkonten greifen als Fallback. Pflege unter "Lohnarten verwalten".`,
        blocking: false,
      });
    }

    // 5) Buchungsstapel ausgeglichen (Soll = Haben)
    let fibuStatus: CheckStatus = 'ok';
    let fibuDetail = '';
    let blockOnFibu = false;
    if (activeEntries.length > 0) {
      try {
        const journal = generateFibuJournal(
          activeEntries,
          kontenrahmen,
          activePeriod.month,
          activePeriod.year,
        );
        const diff = Math.abs(journal.summen.differenz);
        if (journal.summen.anzahlBuchungen === 0) {
          fibuStatus = 'error';
          fibuDetail = 'Buchungsstapel ist leer.';
          blockOnFibu = true;
        } else if (diff < 0.01) {
          fibuStatus = 'ok';
          fibuDetail = `${journal.summen.anzahlBuchungen} Buchungen, Soll = Haben (${fmtCur(journal.summen.sollGesamt)}).`;
        } else if (diff < 1) {
          fibuStatus = 'warn';
          fibuDetail = `Rundungsdifferenz: ${fmtCur(diff)}. Export möglich.`;
        } else {
          fibuStatus = 'error';
          fibuDetail = `Soll/Haben-Differenz: ${fmtCur(diff)}. Bitte Daten prüfen.`;
          blockOnFibu = true;
        }
      } catch (err) {
        fibuStatus = 'error';
        fibuDetail =
          err instanceof Error
            ? `Buchungsstapel konnte nicht erzeugt werden: ${err.message}`
            : 'Buchungsstapel konnte nicht erzeugt werden.';
        blockOnFibu = true;
      }
    } else {
      fibuStatus = 'error';
      fibuDetail = 'Kein Buchungsstapel ohne Abrechnungen.';
      blockOnFibu = true;
    }
    checks.push({
      id: 'fibu',
      label: 'Buchungsstapel ausgeglichen',
      status: fibuStatus,
      detail: fibuDetail,
      blocking: blockOnFibu,
    });

    // 6) Mandantenstammdaten (für DATEV-Header empfohlen)
    const missingCompany: string[] = [];
    if (!companySettings?.company_name) missingCompany.push('Firmenname');
    if (!companySettings?.tax_number) missingCompany.push('Steuernummer');
    if (!companySettings?.betriebsnummer) missingCompany.push('Betriebsnummer');
    if (missingCompany.length === 0) {
      checks.push({
        id: 'company',
        label: 'Mandantenstammdaten vollständig',
        status: 'ok',
        detail: 'Firmenname, Steuernummer und Betriebsnummer sind gepflegt.',
        blocking: false,
      });
    } else {
      checks.push({
        id: 'company',
        label: 'Mandantenstammdaten vollständig',
        status: 'warn',
        detail: `Fehlt: ${missingCompany.join(', ')}. Pflege unter "Einstellungen > Firma".`,
        blocking: false,
      });
    }

    const errors = checks.filter((c) => c.status === 'error').length;
    const warnings = checks.filter((c) => c.status === 'warn').length;
    const blocked = checks.some((c) => c.blocking && c.status === 'error');
    const okCount = checks.filter((c) => c.status === 'ok').length;

    return { checks, errors, warnings, blocked, okCount };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntries, activePeriod, kontenrahmen, companySettings]);

  const handleExport = async () => {
    if (activeEntries.length === 0) {
      toast.error('Keine Abrechnungen', {
        description: 'Es wurden keine Lohnabrechnungen für diese Periode gefunden.',
      });
      return;
    }

    if (validation.blocked) {
      toast.error('Export blockiert', {
        description: 'Bitte beheben Sie die markierten Fehler in der Checkliste.',
      });
      return;
    }

    setIsExporting(true);
    try {
      const { blob, fileName } = await generateTaxAdvisorPackage(activeEntries, activePeriod, {
        kontenrahmen,
        companyName: companySettings?.company_name ?? undefined,
        companyAddress: companyAddress || undefined,
        taxNumber: companySettings?.tax_number ?? undefined,
        betriebsnummer: companySettings?.betriebsnummer ?? undefined,
        contactName: contactName || undefined,
        contactEmail: contactEmail || companySettings?.contact_email || undefined,
        notes: notes || undefined,
      });

      downloadTaxAdvisorPackage(blob, fileName);

      toast.success('Steuerberater-Paket erstellt', {
        description: `${fileName} wurde heruntergeladen.`,
      });
      onExportComplete?.();
      setOpen(false);
    } catch (err) {
      console.error('Tax advisor package error:', err);
      toast.error('Export fehlgeschlagen', {
        description: err instanceof Error ? err.message : 'Unbekannter Fehler.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="w-full gap-2">
            <Package className="h-4 w-4" />
            Steuerberater-Paket erstellen
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Steuerberater-Paket
          </DialogTitle>
          <DialogDescription>
            Erzeugt ein ZIP-Bundle mit DATEV-Datei, FiBu-Journal, Lohnarten-Excel und Begleit-PDF
            in einem Klick – fertig zur Übergabe an Ihren Steuerberater.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Periode + Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
              Übergabe für {format(activePeriod.startDate, 'MMMM yyyy', { locale: de })}
              </CardTitle>
            </CardHeader>
          <CardContent className="space-y-4">
            {/* Perioden-Auswahl */}
            <div className="space-y-1.5">
              <Label
                htmlFor="pkg-period-select"
                className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"
              >
                <CalendarRange className="h-3.5 w-3.5" />
                Abrechnungsperiode
              </Label>
              <div className="flex items-center gap-2">
                {/* Älterer Monat (sortiert neueste-zuerst → höherer Index) */}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  aria-label="Vorheriger Monat (älter)"
                  title="Vorheriger Monat"
                  disabled={
                    isExporting ||
                    periodOptions.length <= 1 ||
                    periodOptions.findIndex((p) => p.id === selectedPeriodId) >=
                      periodOptions.length - 1
                  }
                  onClick={() => {
                    const idx = periodOptions.findIndex((p) => p.id === selectedPeriodId);
                    const next = periodOptions[idx + 1];
                    if (next) handlePeriodChange(next.id);
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Combobox mit Suchfunktion */}
                <Popover open={periodPickerOpen} onOpenChange={setPeriodPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="pkg-period-select"
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={periodPickerOpen}
                      disabled={periodOptions.length <= 1 || isExporting}
                      className="w-full justify-between font-normal"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span className="truncate">
                          {format(activePeriod.startDate, 'MMMM yyyy', { locale: de })}
                        </span>
                        {(() => {
                          const status = (activePeriod.status ?? 'draft').toLowerCase();
                          const closed = [
                            'closed',
                            'completed',
                            'processed',
                            'abgeschlossen',
                          ].includes(status);
                          return (
                            <span
                              className={`text-xs ${closed ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}
                            >
                              {closed ? '· abgeschlossen' : `· ${status}`}
                            </span>
                          );
                        })()}
                      </span>
                      <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0"
                    align="start"
                  >
                    <Command
                      filter={(value, search) => {
                        // value = "MMMM yyyy MM/yyyy yyyy-MM status" (siehe unten)
                        if (!search) return 1;
                        return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
                      }}
                    >
                      <CommandInput placeholder="Monat suchen, z.B. Mai 2026 …" />
                      <CommandList>
                        <CommandEmpty>Keine Periode gefunden.</CommandEmpty>
                        <CommandGroup>
                          {periodOptions.map((p) => {
                            const status = (p.status ?? 'draft').toLowerCase();
                            const closed = [
                              'closed',
                              'completed',
                              'processed',
                              'abgeschlossen',
                            ].includes(status);
                            const monthHuman = format(p.startDate, 'MMMM yyyy', {
                              locale: de,
                            });
                            const monthNumeric = format(p.startDate, 'MM/yyyy');
                            const monthIso = `${p.year}-${String(p.month).padStart(2, '0')}`;
                            // value-String wird vom Command für die Suche genutzt
                            const searchValue =
                              `${monthHuman} ${monthNumeric} ${monthIso} ${status}`;
                            const isSelected = p.id === selectedPeriodId;
                            return (
                              <CommandItem
                                key={p.id}
                                value={searchValue}
                                onSelect={() => handlePeriodChange(p.id)}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${isSelected ? 'opacity-100' : 'opacity-0'}`}
                                />
                                <span className="flex-1 truncate">{monthHuman}</span>
                                <span
                                  className={`text-xs ml-2 ${closed ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}
                                >
                                  {closed ? 'abgeschlossen' : status}
                                </span>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Neuerer Monat (niedrigerer Index) */}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  aria-label="Nächster Monat (neuer)"
                  title="Nächster Monat"
                  disabled={
                    isExporting ||
                    periodOptions.length <= 1 ||
                    periodOptions.findIndex((p) => p.id === selectedPeriodId) <= 0
                  }
                  onClick={() => {
                    const idx = periodOptions.findIndex((p) => p.id === selectedPeriodId);
                    const prev = periodOptions[idx - 1];
                    if (prev) handlePeriodChange(prev.id);
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              {periodOptions.length <= 1 && (
                <p className="text-xs text-muted-foreground">
                  Es ist nur eine Periode verfügbar.
                </p>
              )}
              {hiddenPeriodsCount > 0 && (
                <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <AlertTriangle
                    className="h-3 w-3 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
                    aria-hidden="true"
                  />
                  <span>
                    {hiddenPeriodsCount === 1
                      ? '1 Periode wurde ausgeblendet, weil dafür keine Lohnabrechnungen vorhanden sind.'
                      : `${hiddenPeriodsCount} Perioden wurden ausgeblendet, weil dafür keine Lohnabrechnungen vorhanden sind.`}
                  </span>
                </p>
              )}
            </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{stats.employees} Mitarbeiter</Badge>
                <Badge variant="secondary">Brutto {fmtCur(stats.brutto)}</Badge>
                <Badge variant="secondary">Netto {fmtCur(stats.netto)}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Validierungs-Checkliste */}
          <ValidationChecklist
            checks={validation.checks}
            errors={validation.errors}
            warnings={validation.warnings}
            okCount={validation.okCount}
            blocked={validation.blocked}
          />

          {/* Inhalt */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <p className="text-sm font-medium">Im Paket enthalten:</p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Begleit-PDF mit Summen, Mandantendaten und Inhaltsverzeichnis
              </li>
              <li className="flex items-center gap-2">
                <FileArchive className="h-4 w-4 text-primary" />
                DATEV-Importdatei (EXTF 7.0, CSV)
              </li>
              <li className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                FiBu-Buchungsjournal &amp; Saldenliste (CSV)
              </li>
              <li className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                Lohnarten-Excel (Zusammenfassung, Detail, Summen)
              </li>
            </ul>
          </div>

          <Separator />

          {/* Kontenrahmen */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Kontenrahmen</Label>
            <RadioGroup
              value={kontenrahmen}
              onValueChange={(v) => setKontenrahmen(v as Kontenrahmen)}
              className="grid grid-cols-2 gap-4"
            >
              <Label
                htmlFor="pkg-skr03"
                className={`flex flex-col items-center justify-between rounded-md border-2 p-4 cursor-pointer hover:bg-accent ${
                  kontenrahmen === 'SKR03' ? 'border-primary bg-accent/50' : 'border-muted'
                }`}
              >
                <RadioGroupItem value="SKR03" id="pkg-skr03" className="sr-only" />
                <Building2 className="h-6 w-6 mb-2" />
                <span className="font-medium">SKR 03</span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  Prozessgliederung
                </span>
              </Label>
              <Label
                htmlFor="pkg-skr04"
                className={`flex flex-col items-center justify-between rounded-md border-2 p-4 cursor-pointer hover:bg-accent ${
                  kontenrahmen === 'SKR04' ? 'border-primary bg-accent/50' : 'border-muted'
                }`}
              >
                <RadioGroupItem value="SKR04" id="pkg-skr04" className="sr-only" />
                <Calculator className="h-6 w-6 mb-2" />
                <span className="font-medium">SKR 04</span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  Abschlussgliederung
                </span>
              </Label>
            </RadioGroup>
          </div>

          <Separator />

          {/* Optional: Ansprechpartner / Notizen */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Begleitschreiben (optional)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pkg-contact-name">Ansprechpartner</Label>
                <Input
                  id="pkg-contact-name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Max Mustermann"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pkg-contact-email">E-Mail</Label>
                <Input
                  id="pkg-contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder={companySettings?.contact_email ?? 'lohn@firma.de'}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pkg-notes">Hinweise an den Steuerberater</Label>
              <Textarea
                id="pkg-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="z.B. Bitte Pauschalsteuer für Sachbezug separat verbuchen…"
                rows={3}
              />
            </div>
          </div>

          <Alert>
            <Package className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Mandant: <strong>{companyName}</strong>
              {companyAddress && <> · {companyAddress}</>}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isExporting}>
            Abbrechen
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || activeEntries.length === 0 || validation.blocked}
            className="gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Erstelle ZIP…
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Paket herunterladen
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const fmtCur = (v: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);

function ValidationChecklist({
  checks,
  errors,
  warnings,
  okCount,
  blocked,
}: {
  checks: ValidationCheck[];
  errors: number;
  warnings: number;
  okCount: number;
  blocked: boolean;
}) {
  const headerStatus: CheckStatus = errors > 0 ? 'error' : warnings > 0 ? 'warn' : 'ok';
  const headerLabel =
    headerStatus === 'ok'
      ? 'Alle Pflichtdaten vollständig'
      : headerStatus === 'warn'
        ? `${warnings} Hinweis${warnings === 1 ? '' : 'e'}, Export möglich`
        : `${errors} Fehler – Export blockiert`;

  const headerClass =
    headerStatus === 'ok'
      ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10'
      : headerStatus === 'warn'
        ? 'border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10'
        : 'border-destructive/40 bg-destructive/5';

  const HeaderIcon =
    headerStatus === 'ok' ? ShieldCheck : headerStatus === 'warn' ? AlertTriangle : XCircle;
  const headerIconClass =
    headerStatus === 'ok'
      ? 'text-emerald-600 dark:text-emerald-400'
      : headerStatus === 'warn'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-destructive';

  return (
    <Card className={`shadow-card ${headerClass}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <HeaderIcon className={`h-5 w-5 ${headerIconClass}`} />
            Validierung der Pflichtdaten
          </span>
          <Badge
            variant={headerStatus === 'ok' ? 'secondary' : headerStatus === 'warn' ? 'outline' : 'destructive'}
          >
            {okCount}/{checks.length} OK
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground mb-2">{headerLabel}</p>
        <ul className="space-y-2" role="list">
          {checks.map((c) => (
            <li key={c.id} className="flex items-start gap-2 text-sm">
              {c.status === 'ok' && (
                <CheckCircle2
                  className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-label="OK"
                />
              )}
              {c.status === 'warn' && (
                <AlertTriangle
                  className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
                  aria-label="Hinweis"
                />
              )}
              {c.status === 'error' && (
                <XCircle
                  className="h-4 w-4 mt-0.5 shrink-0 text-destructive"
                  aria-label="Fehler"
                />
              )}
              <span className="flex-1">
                <span className="font-medium text-foreground">{c.label}</span>
                <span className="block text-xs text-muted-foreground mt-0.5">{c.detail}</span>
              </span>
              {c.blocking && c.status === 'error' && (
                <Badge variant="destructive" className="text-[10px] uppercase tracking-wider">
                  Pflicht
                </Badge>
              )}
            </li>
          ))}
        </ul>
        {blocked && (
          <Alert variant="destructive" className="mt-3">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Export blockiert</AlertTitle>
            <AlertDescription>
              Bitte beheben Sie die mit „Pflicht" markierten Fehler, bevor Sie das Paket erstellen.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}