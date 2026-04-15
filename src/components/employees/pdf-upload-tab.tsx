import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Loader2, CheckCircle2, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Employee } from '@/types/employee';

interface ExtractedFields {
  taxId?: string;
  taxClass?: string;
  socialSecurityNumber?: string;
  healthInsurance?: string;
  grossSalary?: number;
  iban?: string;
  bic?: string;
  weeklyHours?: number;
  [key: string]: string | number | undefined;
}

interface PdfUploadTabProps {
  employee: Employee;
  onFieldsExtracted: (fields: ExtractedFields) => void;
}

export function PdfUploadTab({ employee, onFieldsExtracted }: PdfUploadTabProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [extractedFields, setExtractedFields] = useState<ExtractedFields | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePdfUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Bitte wählen Sie eine PDF-Datei aus.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('parse-pdf-employee', {
        body: formData,
      });

      if (error) {
        toast.error(`PDF-Analyse fehlgeschlagen: ${error.message}`);
        return;
      }

      if (!data?.employees || data.employees.length === 0) {
        toast.warning('Keine Mitarbeiterdaten im PDF erkannt.');
        return;
      }

      // Find matching employee by name or take first
      const match = data.employees.find((e: any) =>
        e.firstName?.toLowerCase() === employee.personalData.firstName.toLowerCase() &&
        e.lastName?.toLowerCase() === employee.personalData.lastName.toLowerCase()
      ) || data.employees[0];

      const fields: ExtractedFields = {};
      if (match.taxId) fields.taxId = match.taxId;
      if (match.taxClass) fields.taxClass = match.taxClass;
      if (match.svNumber) fields.socialSecurityNumber = match.svNumber;
      if (match.healthInsurance) fields.healthInsurance = match.healthInsurance;
      if (match.grossSalary) fields.grossSalary = match.grossSalary;
      if (match.iban) fields.iban = match.iban;
      if (match.bic) fields.bic = match.bic;
      if (match.weeklyHours) fields.weeklyHours = match.weeklyHours;

      setExtractedFields(fields);
      toast.success(`${Object.keys(fields).length} Felder aus PDF erkannt.`);
    } catch (e) {
      console.error(e);
      toast.error('PDF-Verarbeitung fehlgeschlagen');
    } finally {
      setIsUploading(false);
    }
  };

  const FIELD_LABELS: Record<string, string> = {
    taxId: 'Steuer-ID',
    taxClass: 'Steuerklasse',
    socialSecurityNumber: 'SV-Nummer',
    healthInsurance: 'Krankenkasse',
    grossSalary: 'Bruttogehalt',
    iban: 'IBAN',
    bic: 'BIC',
    weeklyHours: 'Wochenstunden',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Upload className="h-4 w-4" />
          PDF-Dokument hochladen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Laden Sie ein PDF hoch (z.B. Lohnabrechnung, Personalbogen), um fehlende Felder per KI zu erkennen und automatisch zu übernehmen.
          </AlertDescription>
        </Alert>

        <div
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
              <p className="text-sm font-medium">PDF wird analysiert...</p>
            </>
          ) : (
            <>
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">PDF hier hochladen</p>
              <p className="text-xs text-muted-foreground mt-1">Lohnabrechnung, Personalbogen, DATEV-Auswertung</p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePdfUpload(file);
              e.target.value = '';
            }}
          />
        </div>

        {extractedFields && Object.keys(extractedFields).length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Erkannte Felder:</p>
            <div className="space-y-2">
              {Object.entries(extractedFields).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-accent/50 rounded text-sm">
                  <span className="font-medium">{FIELD_LABELS[key] || key}</span>
                  <Badge variant="secondary">{String(value)}</Badge>
                </div>
              ))}
            </div>
            <Button
              className="w-full"
              onClick={() => {
                onFieldsExtracted(extractedFields);
                setExtractedFields(null);
              }}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Felder übernehmen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
