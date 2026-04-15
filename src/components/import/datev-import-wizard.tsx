import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, AlertTriangle, CheckCircle2, Users, ArrowLeft, ArrowRight, Loader2, Info } from 'lucide-react';
import { parseDatevFile, mergeDatevResults, DatevEmployee, DatevImportResult, inferMissingFields, InferredFields } from '@/utils/datev-import';
import { useDatevImport, ConflictStrategy } from '@/hooks/use-datev-import';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input as FormInput } from '@/components/ui/input';
import { PdfReviewStep, PdfEmployeeData } from './pdf-review-step';
import { supabase } from '@/integrations/supabase/client';

type WizardStep = 'upload' | 'preview' | 'conflicts' | 'import' | 'complete' | 'pdf-review';

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
  const [pdfEmployees, setPdfEmployees] = useState<PdfEmployeeData[]>([]);
  const [pdfDocType, setPdfDocType] = useState('');
  const [isPdfParsing, setIsPdfParsing] = useState(false);

  const { importEmployees, isImporting, progress } = useDatevImport();

  const handleFiles = useCallback(async (newFiles: FileList | File[]) => {
    const allFiles = Array.from(newFiles);
    const textFiles = allFiles.filter(f => f.name.endsWith('.txt') || f.name.endsWith('.csv'));
    const pdfFiles = allFiles.filter(f => f.name.toLowerCase().endsWith('.pdf'));

    if (textFiles.length === 0 && pdfFiles.length === 0) {
      toast.error('Keine unterstützten Dateien gefunden (.txt, .csv, .pdf)');
      return;
    }

    // Handle PDF files via AI extraction
    if (pdfFiles.length > 0) {
      setIsPdfParsing(true);
      setFiles(prev => [...prev, ...pdfFiles]);
      try {
        const allPdfEmps: PdfEmployeeData[] = [];
        let lastDocType = '';
        for (const pdfFile of pdfFiles) {
          const formData = new FormData();
          formData.append('file', pdfFile);
          const { data, error } = await supabase.functions.invoke('parse-pdf-employee', {
            body: formData,
          });
          if (error) {
            toast.error(`PDF-Fehler (${pdfFile.name}): ${error.message}`);
            continue;
          }
          if (data?.employees?.length > 0) {
            allPdfEmps.push(...data.employees);
            lastDocType = data.documentType || 'PDF';
          } else {
            toast.warning(`Keine Daten in ${pdfFile.name} erkannt.`);
          }
        }
        if (allPdfEmps.length > 0) {
          setPdfEmployees(allPdfEmps);
          setPdfDocType(lastDocType);
          setStep('pdf-review');
        }
      } catch (e) {
        toast.error('PDF-Verarbeitung fehlgeschlagen');
        console.error(e);
      } finally {
        setIsPdfParsing(false);
      }
      if (textFiles.length === 0) return;
    }

    // Handle text/csv files (existing logic)
    setFiles(prev => [...prev, ...textFiles]);

    const results: DatevImportResult[] = [];
    for (const file of textFiles) {
      const content = await readFileAsCP1252(file);
      const result = parseDatevFile(content);
      results.push(result);
    }

    const merged = mergeDatevResults(results);
    setParseResults(merged);

    if (merged.employees.length > 0) {
      setStep('preview');
    } else if (pdfFiles.length === 0) {
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

    // Check if there are employees with gaps — offer completion step
    if (parseResults.employees.some(emp => {
      const inferred = inferMissingFields(emp, parseResults.employees);
      return Object.keys(inferred).length > 0;
    })) {
      // Will show "Daten vervollständigen" button
    }
  };

  const handlePdfConfirm = async (confirmed: PdfEmployeeData[]) => {
    const datevEmployees: DatevEmployee[] = confirmed.map(emp => ({
      personalNumber: emp.personalNumber || '',
      firstName: emp.firstName,
      lastName: emp.lastName,
      dateOfBirth: emp.dateOfBirth || undefined,
      gender: undefined,
      street: emp.street || undefined,
      zipCode: emp.zipCode || undefined,
      city: emp.city || undefined,
      state: emp.state || undefined,
      taxId: emp.taxId || undefined,
      taxClass: emp.taxClass ? (['I','II','III','IV','V','VI'].indexOf(emp.taxClass) + 1) || undefined : undefined,
      svNumber: emp.svNumber || undefined,
      healthInsurance: emp.healthInsurance || undefined,
      grossSalary: emp.grossSalary || undefined,
      employmentType: emp.employmentType || 'fulltime',
      entryDate: emp.entryDate || undefined,
      weeklyHours: emp.weeklyHours || undefined,
      iban: emp.iban || undefined,
      bic: emp.bic || undefined,
      churchTax: emp.religion && emp.religion !== 'none' ? true : undefined,
      childrenAllowance: emp.childrenAllowance || undefined,
      source: 'personalstamm' as const,
    }));

    setParseResults({ employees: datevEmployees, lohnarten: [], warnings: [], fileType: 'personalstamm' });
    setStep('preview');
  };

  const reset = () => {
    setStep('upload');
    setFiles([]);
    setParseResults(null);
    setImportDone(false);
    setConflictStrategy('skip');
    setPdfEmployees([]);
    setPdfDocType('');
  };

  // Quality summary
  const qualitySummary = parseResults ? getQualitySummary(parseResults.employees) : null;

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-sm flex-wrap">
        {(['upload', 'preview', 'conflicts', 'import', 'complete'] as WizardStep[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-px bg-border" />}
            <Badge variant={step === s ? 'default' : 'outline'}>
              {i + 1}. {s === 'upload' ? 'Dateien' : s === 'preview' ? 'Vorschau' : s === 'conflicts' ? 'Konflikte' : s === 'import' ? 'Import' : 'Vervollständigen'}
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
                oder klicken zum Auswählen • .txt, .csv, .pdf
              </p>
              <input
                id="datev-file-input"
                type="file"
                multiple
                accept=".txt,.csv,.pdf"
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

      {/* PDF Parsing Loading */}
      {isPdfParsing && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">PDF wird analysiert...</p>
            <p className="text-sm text-muted-foreground mt-1">KI-gestützte Erkennung der Mitarbeiterdaten</p>
          </CardContent>
        </Card>
      )}

      {/* PDF Review Step */}
      {step === 'pdf-review' && pdfEmployees.length > 0 && (
        <PdfReviewStep
          employees={pdfEmployees}
          documentType={pdfDocType}
          onConfirm={handlePdfConfirm}
          onBack={() => { setStep('upload'); setPdfEmployees([]); }}
        />
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
                  <p className="text-2xl font-bold text-primary">{qualitySummary.complete}</p>
                  <p className="text-xs text-muted-foreground">🟢 Vollständig</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold text-accent-foreground">{qualitySummary.partial}</p>
                  <p className="text-xs text-muted-foreground">🟡 Warnungen</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold text-destructive">{qualitySummary.critical}</p>
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
                  <div className="flex justify-center gap-3 pt-4">
                    <Button variant="outline" onClick={reset}>Weiteren Import starten</Button>
                    {parseResults && parseResults.employees.some(emp => {
                      const inferred = inferMissingFields(emp, parseResults.employees);
                      return Object.keys(inferred).length > 0;
                    }) && (
                      <Button onClick={() => setStep('complete')}>
                        Daten vervollständigen <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 5: Data Completion */}
      {step === 'complete' && parseResults && (
        <DataCompletionStep 
          employees={parseResults.employees} 
          onBack={() => setStep('import')}
          onDone={reset}
        />
      )}
    </div>
  );
}

// ─── Data Completion Step ─────────────────────────────

interface EditableInferred {
  taxClass?: { value: number; reason: string };
  weeklyHours?: { value: number; reason: string };
  churchTaxRate?: { value: number; reason: string };
  healthInsurance?: { value: string; reason: string };
}

interface ManualFields {
  taxId: string;
  svNumber: string;
  iban: string;
  dateOfBirth: string;
  entryDate: string;
  state: string;
}

const GERMAN_STATES = [
  'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg',
  'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen', 'Nordrhein-Westfalen',
  'Rheinland-Pfalz', 'Saarland', 'Sachsen', 'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen',
];

function DataCompletionStep({ employees, onBack, onDone }: { 
  employees: DatevEmployee[]; 
  onBack: () => void; 
  onDone: () => void;
}) {
  const [appliedPnrs, setAppliedPnrs] = useState<Set<string>>(new Set());
  const [applyingPnr, setApplyingPnr] = useState<string | null>(null);
  const [applyingAll, setApplyingAll] = useState(false);

  // Show ALL employees, not just those with inferred suggestions
  const allEmps = employees;

  const incompleteEmps = useMemo(() => 
    employees.filter(emp => {
      const inferred = inferMissingFields(emp, employees);
      const hasMissingManual = !emp.taxId || !emp.svNumber || !emp.iban || !emp.dateOfBirth || !emp.entryDate || !emp.state;
      return Object.keys(inferred).length > 0 || hasMissingManual;
    }), [employees]);

  const initialInferredMap = useMemo(() => {
    const map = new Map<string, EditableInferred>();
    for (const emp of incompleteEmps) {
      map.set(emp.personalNumber, inferMissingFields(emp, employees));
    }
    return map;
  }, [incompleteEmps, employees]);

  const initialManualMap = useMemo(() => {
    const map = new Map<string, ManualFields>();
    for (const emp of incompleteEmps) {
      map.set(emp.personalNumber, {
        taxId: emp.taxId || '',
        svNumber: emp.svNumber || '',
        iban: emp.iban || '',
        dateOfBirth: emp.dateOfBirth || '',
        entryDate: emp.entryDate || '',
        state: emp.state || '',
      });
    }
    return map;
  }, [incompleteEmps]);

  const [editedMap, setEditedMap] = useState<Map<string, EditableInferred>>(initialInferredMap);
  const [manualMap, setManualMap] = useState<Map<string, ManualFields>>(initialManualMap);

  const updateField = (pnr: string, field: keyof EditableInferred, value: string | number) => {
    setEditedMap(prev => {
      const next = new Map(prev);
      const current = next.get(pnr) || {};
      const existing = current[field];
      (current as any)[field] = { value, reason: existing?.reason || 'Manuell angepasst' };
      next.set(pnr, { ...current });
      return next;
    });
  };

  const updateManualField = (pnr: string, field: keyof ManualFields, value: string) => {
    setManualMap(prev => {
      const next = new Map(prev);
      const current = next.get(pnr) || { taxId: '', svNumber: '', iban: '', dateOfBirth: '', entryDate: '', state: '' };
      next.set(pnr, { ...current, [field]: value });
      return next;
    });
  };

  /** Validates manual fields and returns error messages per field */
  const validateManualFields = (manual: ManualFields): Partial<Record<keyof ManualFields, string>> => {
    const errors: Partial<Record<keyof ManualFields, string>> = {};
    // Steuer-ID: exactly 11 digits
    if (manual.taxId && !/^\d{11}$/.test(manual.taxId.replace(/\s/g, ''))) {
      errors.taxId = 'Steuer-ID muss genau 11 Ziffern haben';
    }
    // IBAN: starts with DE, 22 chars total (alphanumeric)
    if (manual.iban) {
      const cleaned = manual.iban.replace(/\s/g, '').toUpperCase();
      if (!cleaned.startsWith('DE')) {
        errors.iban = 'IBAN muss mit DE beginnen';
      } else if (cleaned.length !== 22) {
        errors.iban = `IBAN muss 22 Zeichen haben (aktuell: ${cleaned.length})`;
      } else if (!/^DE\d{20}$/.test(cleaned)) {
        errors.iban = 'IBAN darf nach DE nur Ziffern enthalten';
      }
    }
    // SV-Nummer: Format XX DDMMYY L NNN (12 chars without spaces)
    if (manual.svNumber) {
      const cleaned = manual.svNumber.replace(/\s/g, '');
      if (cleaned.length !== 12) {
        errors.svNumber = `SV-Nummer muss 12 Zeichen haben (aktuell: ${cleaned.length})`;
      } else if (!/^\d{2}\d{6}[A-Za-z]\d{3}$/.test(cleaned)) {
        errors.svNumber = 'Format: 2 Ziffern + 6 Ziffern (Geburtsdatum) + 1 Buchstabe + 3 Ziffern';
      }
    }
    return errors;
  };

  /** Check if a specific employee has validation errors */
  const getValidationErrors = (pnr: string) => {
    const manual = manualMap.get(pnr);
    if (!manual) return {};
    return validateManualFields(manual);
  };

  /** Check if any employee has validation errors (blocks "Alle übernehmen") */
  const hasAnyValidationErrors = useMemo(() => {
    for (const [pnr] of manualMap) {
      if (appliedPnrs.has(pnr)) continue;
      const errors = validateManualFields(manualMap.get(pnr)!);
      if (Object.keys(errors).length > 0) return true;
    }
    return false;
  }, [manualMap, appliedPnrs]);

  const buildUpdateData = (pnr: string) => {
    const inferred = editedMap.get(pnr);
    const manual = manualMap.get(pnr);
    const updateData: Record<string, unknown> = {};
    
    if (inferred?.taxClass) updateData.tax_class = inferred.taxClass.value;
    if (inferred?.weeklyHours) updateData.weekly_hours = inferred.weeklyHours.value;
    if (inferred?.churchTaxRate) updateData.church_tax_rate = inferred.churchTaxRate.value;
    if (inferred?.healthInsurance) updateData.health_insurance = inferred.healthInsurance.value;
    
    if (manual?.taxId) updateData.tax_id = manual.taxId;
    if (manual?.svNumber) updateData.sv_number = manual.svNumber;
    if (manual?.iban) updateData.iban = manual.iban;
    if (manual?.dateOfBirth) updateData.date_of_birth = manual.dateOfBirth;
    if (manual?.entryDate) updateData.entry_date = manual.entryDate;
    if (manual?.state) updateData.state = manual.state;
    
    return updateData;
  };

  const applyDefaults = async (pnr: string) => {
    const updateData = buildUpdateData(pnr);
    if (Object.keys(updateData).length === 0) return;

    setApplyingPnr(pnr);
    try {
      const { supabase } = await import('@/integrations/supabase/client');

      const { error } = await supabase
        .from('employees')
        .update(updateData as any)
        .eq('personal_number', pnr);

      if (error) {
        toast.error(`Fehler bei ${pnr}: ${error.message}`);
      } else {
        setAppliedPnrs(prev => new Set(prev).add(pnr));
        toast.success(`Daten für PNr ${pnr} gespeichert`);
      }
    } catch (e) {
      toast.error(`Fehler: ${e instanceof Error ? e.message : 'Unbekannt'}`);
    } finally {
      setApplyingPnr(null);
    }
  };

  const applyAllDefaults = async () => {
    setApplyingAll(true);
    let successCount = 0;
    for (const emp of incompleteEmps) {
      if (appliedPnrs.has(emp.personalNumber)) continue;
      const updateData = buildUpdateData(emp.personalNumber);
      if (Object.keys(updateData).length === 0) continue;

      const { supabase } = await import('@/integrations/supabase/client');
      const { error } = await supabase
        .from('employees')
        .update(updateData as any)
        .eq('personal_number', emp.personalNumber);

      if (!error) {
        setAppliedPnrs(prev => new Set(prev).add(emp.personalNumber));
        successCount++;
      }
    }
    setApplyingAll(false);
    toast.success(`${successCount} Mitarbeiter aktualisiert`);
  };

  if (incompleteEmps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Alle Daten vollständig
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Alle importierten Mitarbeiter haben vollständige Stammdaten.</p>
          <Button className="mt-4" onClick={onDone}>Fertig</Button>
        </CardContent>
      </Card>
    );
  }

  const pendingCount = incompleteEmps.filter(e => !appliedPnrs.has(e.personalNumber)).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Daten vervollständigen – {incompleteEmps.length} Mitarbeiter
        </CardTitle>
        <CardDescription>
          Passen Sie die vorgeschlagenen Werte an und klicken Sie "Übernehmen" um sie zu speichern.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingCount > 1 && (
          <Button 
            onClick={applyAllDefaults} 
            disabled={applyingAll}
            className="w-full"
          >
            {applyingAll ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Wird übernommen...</>
            ) : (
              <>Alle {pendingCount} Vorschläge übernehmen</>
            )}
          </Button>
        )}

        <div className="max-h-[500px] overflow-y-auto space-y-3">
          {incompleteEmps.map(emp => {
            const inferred = editedMap.get(emp.personalNumber);
            if (!inferred) return null;
            const isApplied = appliedPnrs.has(emp.personalNumber);
            const isApplying = applyingPnr === emp.personalNumber;
            return (
              <div key={emp.personalNumber} className={`border rounded-lg p-4 space-y-3 ${isApplied ? 'opacity-60 border-primary/30' : ''}`}>
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">
                    {isApplied && <CheckCircle2 className="h-4 w-4 text-primary inline mr-1" />}
                    {emp.firstName} {emp.lastName}
                    <span className="text-muted-foreground ml-2 text-sm">PNr: {emp.personalNumber}</span>
                  </h4>
                  {!isApplied ? (
                    <Button 
                      size="sm" 
                      onClick={() => applyDefaults(emp.personalNumber)}
                      disabled={isApplying || applyingAll}
                    >
                      {isApplying ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                      Übernehmen
                    </Button>
                  ) : (
                    <Badge variant="default" className="text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Übernommen
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {inferred.taxClass && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Steuerklasse</Label>
                      <Select
                        value={String(inferred.taxClass.value)}
                        onValueChange={(v) => updateField(emp.personalNumber, 'taxClass', parseInt(v))}
                        disabled={isApplied}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6].map(tc => (
                            <SelectItem key={tc} value={String(tc)}>Klasse {tc}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">{inferred.taxClass.reason}</p>
                    </div>
                  )}
                  {inferred.weeklyHours && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Wochenstunden</Label>
                      <FormInput
                        className="h-8 text-sm"
                        type="number"
                        step="0.5"
                        value={inferred.weeklyHours.value}
                        onChange={(e) => updateField(emp.personalNumber, 'weeklyHours', parseFloat(e.target.value) || 0)}
                        disabled={isApplied}
                      />
                      <p className="text-xs text-muted-foreground">{inferred.weeklyHours.reason}</p>
                    </div>
                  )}
                  {inferred.churchTaxRate && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Kirchensteuersatz (%)</Label>
                      <Select
                        value={String(inferred.churchTaxRate.value)}
                        onValueChange={(v) => updateField(emp.personalNumber, 'churchTaxRate', parseFloat(v))}
                        disabled={isApplied}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Keine (0%)</SelectItem>
                          <SelectItem value="8">8%</SelectItem>
                          <SelectItem value="9">9%</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">{inferred.churchTaxRate.reason}</p>
                    </div>
                  )}
                  {inferred.healthInsurance && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Krankenkasse</Label>
                      <FormInput
                        className="h-8 text-sm"
                        value={inferred.healthInsurance.value}
                        onChange={(e) => updateField(emp.personalNumber, 'healthInsurance', e.target.value)}
                        disabled={isApplied}
                      />
                      <p className="text-xs text-muted-foreground">{inferred.healthInsurance.reason}</p>
                    </div>
                  )}
                </div>

                {/* Manual fields section */}
                {(() => {
                  const manual = manualMap.get(emp.personalNumber);
                  if (!manual) return null;
                  const showManual = !emp.taxId || !emp.svNumber || !emp.iban || !emp.dateOfBirth || !emp.entryDate || !emp.state;
                  if (!showManual) return null;
                  return (
                    <>
                      <div className="border-t pt-3 mt-2">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Manuelle Eingabe (fehlende Felder)</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {!emp.taxId && (
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Steuer-ID</Label>
                            <FormInput
                              className="h-8 text-sm"
                              placeholder="z.B. 12345678901"
                              value={manual.taxId}
                              onChange={(e) => updateManualField(emp.personalNumber, 'taxId', e.target.value)}
                              disabled={isApplied}
                            />
                          </div>
                        )}
                        {!emp.svNumber && (
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">SV-Nummer</Label>
                            <FormInput
                              className="h-8 text-sm"
                              placeholder="z.B. 12 010190 M 012"
                              value={manual.svNumber}
                              onChange={(e) => updateManualField(emp.personalNumber, 'svNumber', e.target.value)}
                              disabled={isApplied}
                            />
                          </div>
                        )}
                        {!emp.iban && (
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">IBAN</Label>
                            <FormInput
                              className="h-8 text-sm"
                              placeholder="DE..."
                              value={manual.iban}
                              onChange={(e) => updateManualField(emp.personalNumber, 'iban', e.target.value)}
                              disabled={isApplied}
                            />
                          </div>
                        )}
                        {!emp.dateOfBirth && (
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Geburtsdatum</Label>
                            <FormInput
                              className="h-8 text-sm"
                              type="date"
                              value={manual.dateOfBirth}
                              onChange={(e) => updateManualField(emp.personalNumber, 'dateOfBirth', e.target.value)}
                              disabled={isApplied}
                            />
                          </div>
                        )}
                        {!emp.entryDate && (
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Eintrittsdatum</Label>
                            <FormInput
                              className="h-8 text-sm"
                              type="date"
                              value={manual.entryDate}
                              onChange={(e) => updateManualField(emp.personalNumber, 'entryDate', e.target.value)}
                              disabled={isApplied}
                            />
                          </div>
                        )}
                        {!emp.state && (
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Bundesland</Label>
                            <Select
                              value={manual.state}
                              onValueChange={(v) => updateManualField(emp.personalNumber, 'state', v)}
                              disabled={isApplied}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Auswählen..." />
                              </SelectTrigger>
                              <SelectContent>
                                {GERMAN_STATES.map(s => (
                                  <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            );
          })}
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Hinweis</AlertTitle>
          <AlertDescription>
            Sie können die Werte vor dem Übernehmen frei anpassen. Für eine korrekte Lohnabrechnung sind die echten Werte 
            aus dem ELStAM-Abruf oder den DATEV-Personalstamm-Dateien erforderlich.
          </AlertDescription>
        </Alert>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Zurück
          </Button>
          <Button onClick={onDone}>
            Abschließen
          </Button>
        </div>
      </CardContent>
    </Card>
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
