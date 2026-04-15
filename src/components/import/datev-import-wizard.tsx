import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, AlertTriangle, CheckCircle2, Users, ArrowLeft, ArrowRight, Loader2, Info } from 'lucide-react';
import { parseDatevFile, mergeDatevResults, DatevEmployee, DatevImportResult } from '@/utils/datev-import';
import { useDatevImport, ConflictStrategy } from '@/hooks/use-datev-import';
import { toast } from 'sonner';

type WizardStep = 'upload' | 'preview' | 'conflicts' | 'import';

/**
 * Read a File as Windows-1252 (CP1252) text.
 * DATEV exports use this encoding; reading as UTF-8 corrupts umlauts.
 */
async function readFileAsCP1252(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const decoder = new TextDecoder('windows-1252');
  return decoder.decode(buffer);
}

export function DatevImportWizard() {
  const [step, setStep] = useState<WizardStep>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [parseResults, setParseResults] = useState<DatevImportResult | null>(null);
  const [conflictStrategy, setConflictStrategy] = useState<ConflictStrategy>('skip');
  const [importDone, setImportDone] = useState(false);

  const { importEmployees, isImporting, progress } = useDatevImport();

  const handleFiles = useCallback(async (newFiles: FileList | File[]) => {
    const fileArr = Array.from(newFiles).filter(f =>
      f.name.endsWith('.txt') || f.name.endsWith('.csv')
    );

    if (fileArr.length === 0) {
      toast.error('Keine unterstützten Dateien gefunden (.txt, .csv)');
      return;
    }

    setFiles(prev => [...prev, ...fileArr]);

    const results: DatevImportResult[] = [];
    for (const file of fileArr) {
      const content = await readFileAsCP1252(file);
      const result = parseDatevFile(content);
      results.push(result);
    }

    const merged = mergeDatevResults(results);
    setParseResults(merged);

    if (merged.employees.length > 0) {
      setStep('preview');
    } else {
      toast.error('Keine Mitarbeiterdaten erkannt. Bitte prüfen Sie das Dateiformat.');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleImport = async () => {
    if (!parseResults) return;
    setStep('import');
    const result = await importEmployees(parseResults.employees, conflictStrategy);
    setImportDone(true);
    if (result.errors.length === 0) {
      toast.success(`${result.imported} Mitarbeiter erfolgreich importiert`);
    } else {
      toast.warning(`${result.imported} importiert, ${result.errors.length} Fehler`);
    }
  };

  const reset = () => {
    setStep('upload');
    setFiles([]);
    setParseResults(null);
    setImportDone(false);
    setConflictStrategy('skip');
  };

  // Quality summary
  const qualitySummary = parseResults ? getQualitySummary(parseResults.employees) : null;

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-sm">
        {(['upload', 'preview', 'conflicts', 'import'] as WizardStep[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-px bg-border" />}
            <Badge variant={step === s ? 'default' : s === 'import' && importDone ? 'default' : 'outline'}>
              {i + 1}. {s === 'upload' ? 'Dateien' : s === 'preview' ? 'Vorschau' : s === 'conflicts' ? 'Konflikte' : 'Import'}
            </Badge>
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              DATEV-Dateien hochladen
            </CardTitle>
            <CardDescription>
              Laden Sie die DATEV Lohn & Gehalt Exportdateien hoch (Stammdaten SD, Lohnarten LA, Personalstammdaten).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => document.getElementById('datev-file-input')?.click()}
            >
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">Dateien hierher ziehen</p>
              <p className="text-sm text-muted-foreground mt-1">
                oder klicken zum Auswählen • .txt, .csv
              </p>
              <input
                id="datev-file-input"
                type="file"
                multiple
                accept=".txt,.csv"
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
            </div>

            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Tipp</AlertTitle>
              <AlertDescription>
                Für beste Datenqualität laden Sie sowohl die SD-Datei (Stammdaten) als auch die Personalstamm-Dateien (00xxx_*.txt) hoch. Die Personalstamm-Dateien enthalten detailliertere Informationen wie Steuerklasse, Steuer-ID und SV-Nummer.
              </AlertDescription>
            </Alert>

            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">Geladene Dateien:</p>
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {f.name}
                    <Badge variant="outline" className="text-xs">
                      {(f.size / 1024).toFixed(1)} KB
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && parseResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Vorschau – {parseResults.employees.length} Mitarbeiter erkannt
            </CardTitle>
            <CardDescription>
              Prüfen Sie die erkannten Daten vor dem Import.
              {parseResults.lohnarten.length > 0 && ` ${parseResults.lohnarten.length} Lohnarten erkannt.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quality Summary */}
            {qualitySummary && (
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{qualitySummary.complete}</p>
                  <p className="text-xs text-muted-foreground">🟢 Vollständig</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{qualitySummary.partial}</p>
                  <p className="text-xs text-muted-foreground">🟡 Warnungen</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{qualitySummary.critical}</p>
                  <p className="text-xs text-muted-foreground">🔴 Kritisch</p>
                </div>
              </div>
            )}

            {/* Missing fields hint */}
            {qualitySummary && qualitySummary.missingFields.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Häufig fehlende Felder</AlertTitle>
                <AlertDescription>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {qualitySummary.missingFields.map(({ field, count }) => (
                      <Badge key={field} variant="outline" className="text-xs">
                        {field}: {count}×
                      </Badge>
                    ))}
                  </div>
                  {qualitySummary.hasOnlySDData && (
                    <p className="mt-2 text-sm">
                      💡 Laden Sie zusätzlich die Personalstamm-Dateien (00xxx_*.txt) hoch, um fehlende Felder zu ergänzen.
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {parseResults.warnings.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warnungen ({parseResults.warnings.length})</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-1 text-sm">
                    {parseResults.warnings.slice(0, 5).map((w, i) => <li key={i}>{w}</li>)}
                    {parseResults.warnings.length > 5 && <li>... und {parseResults.warnings.length - 5} weitere</li>}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PNr</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Geburtsdatum</TableHead>
                    <TableHead>Eintritt</TableHead>
                    <TableHead>Gehalt</TableHead>
                    <TableHead>StKl</TableHead>
                    <TableHead>Krankenkasse</TableHead>
                    <TableHead>Bundesland</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parseResults.employees.map((emp, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono">{emp.personalNumber}</TableCell>
                      <TableCell>{emp.lastName}, {emp.firstName}</TableCell>
                      <TableCell>{emp.dateOfBirth || '–'}</TableCell>
                      <TableCell>{emp.entryDate || '–'}</TableCell>
                      <TableCell>{emp.grossSalary ? `${emp.grossSalary.toLocaleString('de-DE')} €` : '–'}</TableCell>
                      <TableCell>{emp.taxClass ?? '–'}</TableCell>
                      <TableCell className="max-w-32 truncate">{emp.healthInsurance || emp.healthInsuranceNumber || '–'}</TableCell>
                      <TableCell className="text-xs">{emp.state || '–'}</TableCell>
                      <TableCell>
                        <FieldCompleteness employee={emp} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={reset}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Zurück
              </Button>
              <Button onClick={() => setStep('conflicts')}>
                Weiter <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Conflict Resolution */}
      {step === 'conflicts' && (
        <Card>
          <CardHeader>
            <CardTitle>Konfliktauflösung</CardTitle>
            <CardDescription>
              Was soll passieren, wenn ein Mitarbeiter mit gleicher Personal-Nr oder SV-Nr bereits existiert?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={conflictStrategy} onValueChange={(v) => setConflictStrategy(v as ConflictStrategy)}>
              <div className="flex items-start space-x-3 p-3 rounded-lg border">
                <RadioGroupItem value="skip" id="skip" className="mt-0.5" />
                <Label htmlFor="skip" className="cursor-pointer">
                  <p className="font-medium">Überspringen</p>
                  <p className="text-sm text-muted-foreground">Bestehende Mitarbeiter werden nicht verändert.</p>
                </Label>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-lg border">
                <RadioGroupItem value="merge" id="merge" className="mt-0.5" />
                <Label htmlFor="merge" className="cursor-pointer">
                  <p className="font-medium">Zusammenführen</p>
                  <p className="text-sm text-muted-foreground">Nur leere Felder werden aus DATEV übernommen, vorhandene bleiben.</p>
                </Label>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-lg border">
                <RadioGroupItem value="overwrite" id="overwrite" className="mt-0.5" />
                <Label htmlFor="overwrite" className="cursor-pointer">
                  <p className="font-medium">Überschreiben</p>
                  <p className="text-sm text-muted-foreground">DATEV-Daten ersetzen bestehende Werte vollständig.</p>
                </Label>
              </div>
            </RadioGroup>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('preview')}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Zurück
              </Button>
              <Button onClick={handleImport}>
                {parseResults?.employees.length} Mitarbeiter importieren <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Import */}
      {step === 'import' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importDone ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Loader2 className="h-5 w-5 animate-spin" />}
              {importDone ? 'Import abgeschlossen' : 'Import läuft...'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {progress && (
              <>
                <Progress value={(progress.imported + progress.skipped) / progress.total * 100} />
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{progress.imported}</p>
                    <p className="text-sm text-muted-foreground">Importiert</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-muted-foreground">{progress.skipped}</p>
                    <p className="text-sm text-muted-foreground">Übersprungen</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-destructive">{progress.errors.length}</p>
                    <p className="text-sm text-muted-foreground">Fehler</p>
                  </div>
                </div>

                {progress.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Fehler beim Import</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside mt-1 text-sm">
                        {progress.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {importDone && (
                  <div className="flex justify-center pt-4">
                    <Button onClick={reset}>Weiteren Import starten</Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Quality helpers ──────────────────────────────────

const CRITICAL_FIELDS: { key: keyof DatevEmployee; label: string }[] = [
  { key: 'taxClass', label: 'Steuerklasse' },
  { key: 'taxId', label: 'Steuer-ID' },
  { key: 'svNumber', label: 'SV-Nummer' },
  { key: 'grossSalary', label: 'Gehalt' },
];

const IMPORTANT_FIELDS: { key: keyof DatevEmployee; label: string }[] = [
  { key: 'iban', label: 'IBAN' },
  { key: 'healthInsurance', label: 'Krankenkasse' },
  { key: 'weeklyHours', label: 'Wochenstunden' },
  { key: 'entryDate', label: 'Eintrittsdatum' },
  { key: 'dateOfBirth', label: 'Geburtsdatum' },
  { key: 'churchTax', label: 'Kirchensteuer' },
  { key: 'state', label: 'Bundesland' },
];

function getEmployeeQuality(emp: DatevEmployee): 'complete' | 'partial' | 'critical' {
  const missingCritical = CRITICAL_FIELDS.filter(f => {
    const v = emp[f.key];
    return v === undefined || v === null || v === '';
  });
  if (missingCritical.length > 0) return 'critical';

  const missingImportant = IMPORTANT_FIELDS.filter(f => {
    const v = emp[f.key];
    return v === undefined || v === null || v === '';
  });
  if (missingImportant.length > 2) return 'partial';

  return 'complete';
}

function getQualitySummary(employees: DatevEmployee[]) {
  let complete = 0, partial = 0, critical = 0;
  const fieldMissCounts = new Map<string, number>();
  let sdOnly = 0;

  for (const emp of employees) {
    const q = getEmployeeQuality(emp);
    if (q === 'complete') complete++;
    else if (q === 'partial') partial++;
    else critical++;

    if (emp.source === 'SD') sdOnly++;

    for (const f of [...CRITICAL_FIELDS, ...IMPORTANT_FIELDS]) {
      const v = emp[f.key];
      if (v === undefined || v === null || v === '') {
        fieldMissCounts.set(f.label, (fieldMissCounts.get(f.label) || 0) + 1);
      }
    }
  }

  const missingFields = Array.from(fieldMissCounts.entries())
    .map(([field, count]) => ({ field, count }))
    .filter(x => x.count >= 3)
    .sort((a, b) => b.count - a.count);

  return {
    complete,
    partial,
    critical,
    missingFields,
    hasOnlySDData: sdOnly === employees.length && employees.length > 2,
  };
}

function FieldCompleteness({ employee }: { employee: DatevEmployee }) {
  const quality = getEmployeeQuality(employee);
  const allFields = [...CRITICAL_FIELDS, ...IMPORTANT_FIELDS];
  const filled = allFields.filter(f => {
    const v = employee[f.key];
    return v !== undefined && v !== null && v !== '';
  }).length;
  const pct = Math.round((filled / allFields.length) * 100);

  const variant = quality === 'complete' ? 'default' : quality === 'partial' ? 'secondary' : 'destructive';
  const icon = quality === 'complete' ? '🟢' : quality === 'partial' ? '🟡' : '🔴';

  return (
    <Badge variant={variant} className="text-xs">
      {icon} {pct}%
    </Badge>
  );
}
