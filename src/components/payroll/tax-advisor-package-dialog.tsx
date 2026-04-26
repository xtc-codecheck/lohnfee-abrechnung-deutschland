/**
 * Steuerberater-Paket Dialog
 *
 * One-Click-Export: erzeugt ein ZIP mit DATEV CSV, FiBu-Journal,
 * Lohnarten-Excel und Begleit-PDF für die Übergabe an den Steuerberater.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { useCompanySettings } from '@/hooks/use-company-settings';

interface TaxAdvisorPackageDialogProps {
  payrollEntries: PayrollEntry[];
  periode: PayrollPeriod;
  trigger?: React.ReactNode;
  onExportComplete?: () => void;
}

export function TaxAdvisorPackageDialog({
  payrollEntries,
  periode,
  trigger,
  onExportComplete,
}: TaxAdvisorPackageDialogProps) {
  const { settings: companySettings } = useCompanySettings();
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [kontenrahmen, setKontenrahmen] = useState<Kontenrahmen>('SKR03');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [notes, setNotes] = useState('');

  const companyName = companySettings?.company_name ?? 'Mandant';
  const companyAddress = [
    companySettings?.street,
    [companySettings?.zip_code, companySettings?.city].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ');

  const stats = {
    employees: payrollEntries.length,
    brutto: payrollEntries.reduce((s, e) => s + e.salaryCalculation.grossSalary, 0),
    netto: payrollEntries.reduce((s, e) => s + e.finalNetSalary, 0),
  };

  const handleExport = async () => {
    if (payrollEntries.length === 0) {
      toast.error('Keine Abrechnungen', {
        description: 'Es wurden keine Lohnabrechnungen für diese Periode gefunden.',
      });
      return;
    }

    setIsExporting(true);
    try {
      const { blob, fileName } = await generateTaxAdvisorPackage(payrollEntries, periode, {
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

  const fmtCur = (v: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);

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
                Übergabe für {format(periode.startDate, 'MMMM yyyy', { locale: de })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{stats.employees} Mitarbeiter</Badge>
                <Badge variant="secondary">Brutto {fmtCur(stats.brutto)}</Badge>
                <Badge variant="secondary">Netto {fmtCur(stats.netto)}</Badge>
              </div>
            </CardContent>
          </Card>

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
            disabled={isExporting || payrollEntries.length === 0}
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