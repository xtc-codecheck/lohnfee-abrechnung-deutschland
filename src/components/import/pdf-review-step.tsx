import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, FileText, Info } from 'lucide-react';

export interface PdfEmployeeData {
  firstName: string;
  firstName_confidence?: number;
  lastName: string;
  lastName_confidence?: number;
  personalNumber?: string;
  personalNumber_confidence?: number;
  taxClass?: string;
  taxClass_confidence?: number;
  taxId?: string;
  taxId_confidence?: number;
  svNumber?: string;
  svNumber_confidence?: number;
  grossSalary?: number;
  grossSalary_confidence?: number;
  healthInsurance?: string;
  healthInsurance_confidence?: number;
  iban?: string;
  iban_confidence?: number;
  bic?: string;
  bic_confidence?: number;
  dateOfBirth?: string;
  dateOfBirth_confidence?: number;
  entryDate?: string;
  entryDate_confidence?: number;
  street?: string;
  zipCode?: string;
  city?: string;
  state?: string;
  employmentType?: string;
  weeklyHours?: number;
  religion?: string;
  childrenAllowance?: number;
}

interface PdfReviewStepProps {
  employees: PdfEmployeeData[];
  documentType: string;
  onConfirm: (employees: PdfEmployeeData[]) => void;
  onBack: () => void;
}

function ConfidenceBadge({ score }: { score?: number }) {
  if (score === undefined) return null;
  const pct = Math.round(score * 100);
  const variant = pct >= 80 ? 'default' : pct >= 50 ? 'secondary' : 'destructive';
  return <Badge variant={variant} className="text-xs ml-1">{pct}%</Badge>;
}

const FIELD_LABELS: Record<string, string> = {
  firstName: 'Vorname',
  lastName: 'Nachname',
  personalNumber: 'Personalnummer',
  taxClass: 'Steuerklasse',
  taxId: 'Steuer-ID',
  svNumber: 'SV-Nummer',
  grossSalary: 'Bruttogehalt',
  healthInsurance: 'Krankenkasse',
  iban: 'IBAN',
  bic: 'BIC',
  dateOfBirth: 'Geburtsdatum',
  entryDate: 'Eintrittsdatum',
  street: 'Straße',
  zipCode: 'PLZ',
  city: 'Ort',
  state: 'Bundesland',
  employmentType: 'Beschäftigungsart',
  weeklyHours: 'Wochenstunden',
  religion: 'Religion',
  childrenAllowance: 'Kinderfreibeträge',
};

const EDITABLE_FIELDS = [
  'firstName', 'lastName', 'personalNumber', 'taxClass', 'taxId', 'svNumber',
  'grossSalary', 'healthInsurance', 'iban', 'bic', 'dateOfBirth', 'entryDate',
  'street', 'zipCode', 'city', 'state', 'employmentType', 'weeklyHours',
] as const;

export function PdfReviewStep({ employees, documentType, onConfirm, onBack }: PdfReviewStepProps) {
  const [editedEmployees, setEditedEmployees] = useState<PdfEmployeeData[]>(employees);

  const updateField = (empIndex: number, field: string, value: string | number) => {
    setEditedEmployees(prev => prev.map((emp, i) =>
      i === empIndex ? { ...emp, [field]: value } : emp
    ));
  };

  const filledFieldsCount = (emp: PdfEmployeeData) => {
    return EDITABLE_FIELDS.filter(f => {
      const v = emp[f as keyof PdfEmployeeData];
      return v !== undefined && v !== null && v !== '';
    }).length;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          PDF-Erkennung prüfen
        </CardTitle>
        <CardDescription>
          Dokumenttyp: <Badge variant="outline">{documentType}</Badge> — 
          {editedEmployees.length} Mitarbeiter erkannt. Bitte prüfen und korrigieren Sie die Daten.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>KI-Erkennung</AlertTitle>
          <AlertDescription>
            Die Daten wurden automatisch per KI aus dem PDF extrahiert. Felder mit niedrigem Konfidenz-Score
            (gelb/rot) sollten besonders sorgfältig geprüft werden.
          </AlertDescription>
        </Alert>

        <div className="space-y-6 max-h-[500px] overflow-y-auto">
          {editedEmployees.map((emp, empIndex) => (
            <div key={empIndex} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-lg">
                  {emp.firstName} {emp.lastName}
                  {emp.personalNumber && (
                    <span className="text-muted-foreground ml-2 text-sm font-normal">
                      PNr: {emp.personalNumber}
                    </span>
                  )}
                </h4>
                <Badge variant="outline">
                  {filledFieldsCount(emp)}/{EDITABLE_FIELDS.length} Felder
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {EDITABLE_FIELDS.map(field => {
                  const value = emp[field as keyof PdfEmployeeData];
                  const confidence = emp[`${field}_confidence` as keyof PdfEmployeeData] as number | undefined;
                  const label = FIELD_LABELS[field] || field;

                  if (field === 'taxClass') {
                    return (
                      <div key={field} className="space-y-1">
                        <Label className="text-xs flex items-center gap-1">
                          {label}
                          <ConfidenceBadge score={confidence} />
                        </Label>
                        <Select
                          value={(value as string) || ''}
                          onValueChange={(v) => updateField(empIndex, field, v)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            {['I', 'II', 'III', 'IV', 'V', 'VI'].map(tc => (
                              <SelectItem key={tc} value={tc}>Klasse {tc}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  }

                  if (field === 'employmentType') {
                    return (
                      <div key={field} className="space-y-1">
                        <Label className="text-xs flex items-center gap-1">
                          {label}
                          <ConfidenceBadge score={confidence} />
                        </Label>
                        <Select
                          value={(value as string) || ''}
                          onValueChange={(v) => updateField(empIndex, field, v)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fulltime">Vollzeit</SelectItem>
                            <SelectItem value="parttime">Teilzeit</SelectItem>
                            <SelectItem value="minijob">Minijob</SelectItem>
                            <SelectItem value="midijob">Midijob</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  }

                  return (
                    <div key={field} className="space-y-1">
                      <Label className="text-xs flex items-center gap-1">
                        {label}
                        <ConfidenceBadge score={confidence} />
                      </Label>
                      <Input
                        className="h-8 text-sm"
                        type={field === 'grossSalary' || field === 'weeklyHours' ? 'number' : 'text'}
                        value={value !== undefined && value !== null ? String(value) : ''}
                        onChange={(e) => {
                          const v = field === 'grossSalary' || field === 'weeklyHours'
                            ? parseFloat(e.target.value) || 0
                            : e.target.value;
                          updateField(empIndex, field, v);
                        }}
                        placeholder="—"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {editedEmployees.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Keine Mitarbeiterdaten im PDF erkannt.</p>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Zurück
          </Button>
          <Button
            onClick={() => onConfirm(editedEmployees)}
            disabled={editedEmployees.length === 0}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {editedEmployees.length} Mitarbeiter importieren
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
