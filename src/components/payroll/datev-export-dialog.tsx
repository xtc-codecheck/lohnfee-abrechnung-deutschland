/**
 * DATEV Export Dialog
 * 
 * Ermöglicht den Export von Lohnabrechnungen im DATEV-ASCII-Format
 * mit Auswahl von SKR03 oder SKR04 Kontenrahmen.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  Shield, 
  FileText, 
  Building2, 
  Calculator,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { PayrollEntry, PayrollPeriod } from '@/types/payroll';
import {
  generateDatevExport,
  generateSummaryBookings,
  DatevExportConfig,
  Kontenrahmen,
  getDefaultDatevConfig,
  validateDatevConfig,
  SKR03_KONTEN,
  SKR04_KONTEN,
} from '@/utils/datev-export';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface DatevExportDialogProps {
  payrollEntries: PayrollEntry[];
  periode: PayrollPeriod;
  onExportComplete?: () => void;
}

export function DatevExportDialog({
  payrollEntries,
  periode,
  onExportComplete,
}: DatevExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [config, setConfig] = useState<DatevExportConfig>(getDefaultDatevConfig());
  const [includeSummary, setIncludeSummary] = useState(true);
  const [separateFiles, setSeparateFiles] = useState(false);

  const handleConfigChange = <K extends keyof DatevExportConfig>(
    key: K,
    value: DatevExportConfig[K]
  ) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = async () => {
    const errors = validateDatevConfig(config);
    if (errors.length > 0) {
      toast.error('Konfigurationsfehler', {
        description: errors.join(', '),
      });
      return;
    }

    setIsExporting(true);

    try {
      // Hauptexport generieren
      const csvContent = generateDatevExport(payrollEntries, periode, config);
      
      // BOM für UTF-8 mit Excel-Kompatibilität (optional ISO-8859-1)
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      // Download triggern
      const fileName = `EXTF_Lohnbuchungen_${config.kontenrahmen}_${format(periode.startDate, 'yyyy-MM')}.csv`;
      downloadBlob(blob, fileName);

      // Optional: Sammelüberweisungen separat
      if (includeSummary && separateFiles) {
        const summaryBookings = generateSummaryBookings(payrollEntries, config, periode);
        // Hier könnte ein zweiter Export erfolgen
      }

      toast.success('DATEV-Export erfolgreich', {
        description: `${payrollEntries.length} Mitarbeiter exportiert mit ${config.kontenrahmen}`,
      });

      onExportComplete?.();
      setOpen(false);
    } catch (error) {
      console.error('DATEV Export Error:', error);
      toast.error('Export fehlgeschlagen', {
        description: 'Bitte prüfen Sie die Konfiguration.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Vorschau der verwendeten Konten
  const previewKonten = config.kontenrahmen === 'SKR03' ? SKR03_KONTEN : SKR04_KONTEN;

  // Berechne Statistiken
  const stats = {
    mitarbeiter: payrollEntries.length,
    brutto: payrollEntries.reduce((sum, e) => sum + e.salaryCalculation.grossSalary, 0),
    netto: payrollEntries.reduce((sum, e) => sum + e.finalNetSalary, 0),
    steuern: payrollEntries.reduce((sum, e) => sum + e.salaryCalculation.taxes.total, 0),
    svGesamt: payrollEntries.reduce(
      (sum, e) => sum + e.salaryCalculation.socialSecurityContributions.total.total, 
      0
    ),
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Shield className="h-4 w-4" />
          DATEV Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            DATEV-Export für Steuerberater
          </DialogTitle>
          <DialogDescription>
            Exportieren Sie Lohnabrechnungen im DATEV-ASCII-Format für den Import in DATEV Rechnungswesen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Periode Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Export-Zeitraum
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {format(periode.startDate, 'MMMM yyyy', { locale: de })}
                </span>
                <div className="flex gap-2">
                  <Badge variant="outline">{stats.mitarbeiter} Mitarbeiter</Badge>
                  <Badge variant="secondary">{formatCurrency(stats.brutto)} Brutto</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kontenrahmen Auswahl */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Kontenrahmen</Label>
            <RadioGroup
              value={config.kontenrahmen}
              onValueChange={(value) => handleConfigChange('kontenrahmen', value as Kontenrahmen)}
              className="grid grid-cols-2 gap-4"
            >
              <Label
                htmlFor="skr03"
                className={`flex flex-col items-center justify-between rounded-md border-2 p-4 cursor-pointer hover:bg-accent ${
                  config.kontenrahmen === 'SKR03' ? 'border-primary bg-accent/50' : 'border-muted'
                }`}
              >
                <RadioGroupItem value="SKR03" id="skr03" className="sr-only" />
                <Building2 className="h-6 w-6 mb-2" />
                <span className="font-medium">SKR 03</span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  Prozessgliederung<br />
                  Löhne: 4100 | SV-AG: 4130
                </span>
              </Label>
              <Label
                htmlFor="skr04"
                className={`flex flex-col items-center justify-between rounded-md border-2 p-4 cursor-pointer hover:bg-accent ${
                  config.kontenrahmen === 'SKR04' ? 'border-primary bg-accent/50' : 'border-muted'
                }`}
              >
                <RadioGroupItem value="SKR04" id="skr04" className="sr-only" />
                <Calculator className="h-6 w-6 mb-2" />
                <span className="font-medium">SKR 04</span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  Abschlussgliederung<br />
                  Löhne: 6000 | SV-AG: 6110
                </span>
              </Label>
            </RadioGroup>
          </div>

          <Separator />

          {/* DATEV-Konfiguration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="beraterNr">Beraternummer (7-stellig)</Label>
              <Input
                id="beraterNr"
                value={config.beraterNr}
                onChange={(e) => handleConfigChange('beraterNr', e.target.value)}
                placeholder="1234567"
                maxLength={7}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mandantenNr">Mandantennummer (5-stellig)</Label>
              <Input
                id="mandantenNr"
                value={config.mandantenNr}
                onChange={(e) => handleConfigChange('mandantenNr', e.target.value)}
                placeholder="12345"
                maxLength={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sachkontenlaenge">Sachkontenlänge</Label>
              <Select
                value={config.sachkontenlaenge.toString()}
                onValueChange={(value) => handleConfigChange('sachkontenlaenge', parseInt(value) as 4 | 5 | 6 | 7 | 8)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4-stellig</SelectItem>
                  <SelectItem value="5">5-stellig</SelectItem>
                  <SelectItem value="6">6-stellig</SelectItem>
                  <SelectItem value="7">7-stellig</SelectItem>
                  <SelectItem value="8">8-stellig</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wirtschaftsjahr">Wirtschaftsjahr Beginn</Label>
              <Input
                id="wirtschaftsjahr"
                type="date"
                value={format(config.wirtschaftsjahrBeginn, 'yyyy-MM-dd')}
                onChange={(e) => handleConfigChange('wirtschaftsjahrBeginn', new Date(e.target.value))}
              />
            </div>
          </div>

          <Separator />

          {/* Export-Optionen */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Export-Optionen</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeSummary"
                  checked={includeSummary}
                  onCheckedChange={(checked) => setIncludeSummary(!!checked)}
                />
                <Label htmlFor="includeSummary" className="font-normal">
                  Sammelüberweisungen an Finanzamt/SV-Träger einschließen
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="separateFiles"
                  checked={separateFiles}
                  onCheckedChange={(checked) => setSeparateFiles(!!checked)}
                  disabled={!includeSummary}
                />
                <Label htmlFor="separateFiles" className="font-normal">
                  Als separate Datei exportieren
                </Label>
              </div>
            </div>
          </div>

          {/* Konten-Vorschau */}
          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-purple-700">
                <Info className="h-4 w-4" />
                Verwendete Konten ({config.kontenrahmen})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Löhne/Gehälter:</span>
                  <span className="font-mono">{previewKonten.loehneGehalt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SV Arbeitgeber:</span>
                  <span className="font-mono">{previewKonten.svAnteilAg}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Verb. Löhne:</span>
                  <span className="font-mono">{previewKonten.verbindlichkeitenLoehne}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Verb. Finanzamt:</span>
                  <span className="font-mono">{previewKonten.verbindlichkeitenFinanzamt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Verb. SV-Träger:</span>
                  <span className="font-mono">{previewKonten.verbindlichkeitenSv}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank:</span>
                  <span className="font-mono">{previewKonten.bank}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export-Zusammenfassung */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                <span>Bruttolöhne gesamt:</span>
                <span className="font-medium text-right">{formatCurrency(stats.brutto)}</span>
                <span>Lohnsteuern gesamt:</span>
                <span className="font-medium text-right">{formatCurrency(stats.steuern)}</span>
                <span>SV-Beiträge gesamt:</span>
                <span className="font-medium text-right">{formatCurrency(stats.svGesamt)}</span>
                <span>Nettolöhne gesamt:</span>
                <span className="font-medium text-right">{formatCurrency(stats.netto)}</span>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || payrollEntries.length === 0}
            className="gap-2"
          >
            {isExporting ? (
              'Exportiere...'
            ) : (
              <>
                <Download className="h-4 w-4" />
                DATEV exportieren
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
