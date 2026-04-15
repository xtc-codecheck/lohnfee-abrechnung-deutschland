import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { parseDatevPersonalstamm, type DatevEmployee } from "@/utils/datev-import";
import { useToast } from "@/hooks/use-toast";

interface PersonalstammUploadProps {
  /** The employee's personal_number in the DB */
  personalNumber: string;
  /** The employee's DB id (uuid) */
  employeeId: string;
  /** Current DB field values for showing what's missing */
  currentFields: {
    taxClass: number | null;
    taxId: string | null;
    svNumber: string | null;
    healthInsurance: string | null;
    weeklyHours: number | null;
    churchTax: boolean | null;
    churchTaxRate: number | null;
    iban: string | null;
    bic: string | null;
    dateOfBirth: string | null;
  };
  onUpdated?: () => void;
}

interface MergePreview {
  field: string;
  label: string;
  oldValue: string;
  newValue: string;
}

export function PersonalstammUpload({ personalNumber, employeeId, currentFields, onUpdated }: PersonalstammUploadProps) {
  const [parsed, setParsed] = useState<DatevEmployee | null>(null);
  const [preview, setPreview] = useState<MergePreview[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setParsed(null);
    setPreview([]);
    setSaved(false);
    setFileName(file.name);

    try {
      const content = await file.text();
      const result = parseDatevPersonalstamm(content);

      if (result.employees.length === 0) {
        setError("Keine Mitarbeiterdaten in der Datei gefunden.");
        return;
      }

      const emp = result.employees[0];

      // Check if personal number matches (skip if no personalNumber provided — direct upload)
      if (personalNumber && emp.personalNumber !== personalNumber && emp.personalNumber !== personalNumber.replace(/^0+/, '')) {
        setError(
          `Personalnummer in Datei (${emp.personalNumber}) stimmt nicht mit diesem Mitarbeiter (${personalNumber}) überein. ` +
          `Bitte laden Sie die richtige Personalstamm-Datei hoch.`
        );
        return;
      }

      setParsed(emp);

      // Build merge preview — only fields that are currently empty but present in the file
      const merges: MergePreview[] = [];

      if (!currentFields.taxId && emp.taxId) {
        merges.push({ field: 'tax_id', label: 'Steuer-ID', oldValue: '—', newValue: emp.taxId });
      }
      if (!currentFields.taxClass && emp.taxClass) {
        merges.push({ field: 'tax_class', label: 'Steuerklasse', oldValue: '—', newValue: String(emp.taxClass) });
      }
      if (!currentFields.svNumber && emp.svNumber) {
        merges.push({ field: 'sv_number', label: 'SV-Nummer', oldValue: '—', newValue: emp.svNumber });
      }
      if (!currentFields.healthInsurance && emp.healthInsurance) {
        merges.push({ field: 'health_insurance', label: 'Krankenkasse', oldValue: '—', newValue: emp.healthInsurance });
      }
      if (!currentFields.weeklyHours && emp.weeklyHours) {
        merges.push({ field: 'weekly_hours', label: 'Wochenstunden', oldValue: '—', newValue: String(emp.weeklyHours) });
      }
      if (!currentFields.churchTaxRate && emp.churchTaxRate) {
        merges.push({ field: 'church_tax_rate', label: 'KiSt-Satz', oldValue: '—', newValue: `${emp.churchTaxRate}%` });
      }
      if (currentFields.churchTax === null && emp.churchTax !== undefined) {
        merges.push({ field: 'church_tax', label: 'Kirchensteuer', oldValue: '—', newValue: emp.churchTax ? 'Ja' : 'Nein' });
      }
      if (!currentFields.iban && emp.iban) {
        merges.push({ field: 'iban', label: 'IBAN', oldValue: '—', newValue: emp.iban });
      }
      if (!currentFields.bic && emp.bic) {
        merges.push({ field: 'bic', label: 'BIC', oldValue: '—', newValue: emp.bic });
      }
      if (!currentFields.dateOfBirth && emp.dateOfBirth) {
        merges.push({ field: 'date_of_birth', label: 'Geburtsdatum', oldValue: '—', newValue: emp.dateOfBirth });
      }

      setPreview(merges);

      if (merges.length === 0) {
        toast({ title: "Keine neuen Daten", description: "Alle Felder in der Datei sind bereits befüllt." });
      }
    } catch (err) {
      setError(`Fehler beim Lesen der Datei: ${err instanceof Error ? err.message : 'Unbekannt'}`);
    }

    // Reset file input
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleApply = async () => {
    if (!parsed || preview.length === 0) return;

    setSaving(true);
    try {
      const updateData: Record<string, unknown> = {};
      for (const merge of preview) {
        switch (merge.field) {
          case 'tax_id': updateData.tax_id = parsed.taxId; break;
          case 'tax_class': updateData.tax_class = parsed.taxClass; break;
          case 'sv_number': updateData.sv_number = parsed.svNumber; break;
          case 'health_insurance': updateData.health_insurance = parsed.healthInsurance; break;
          case 'weekly_hours': updateData.weekly_hours = parsed.weeklyHours; break;
          case 'church_tax_rate': updateData.church_tax_rate = parsed.churchTaxRate; break;
          case 'church_tax': updateData.church_tax = parsed.churchTax; break;
          case 'iban': updateData.iban = parsed.iban; break;
          case 'bic': updateData.bic = parsed.bic; break;
          case 'date_of_birth': updateData.date_of_birth = parsed.dateOfBirth; break;
        }
      }

      const { error: dbError } = await supabase
        .from('employees')
        .update(updateData as any)
        .eq('id', employeeId);

      if (dbError) throw new Error(dbError.message);

      setSaved(true);
      toast({ title: "Daten übernommen", description: `${preview.length} Felder erfolgreich aktualisiert.` });
      onUpdated?.();
    } catch (err) {
      toast({ title: "Fehler", description: err instanceof Error ? err.message : 'Unbekannt', variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload className="h-4 w-4" />
          Personalstamm-Datei nachladen
        </CardTitle>
        <CardDescription>
          Laden Sie eine einzelne DATEV-Personalstamm-Datei hoch, um fehlende Felder zu ergänzen. 
          Nur leere Felder werden überschrieben.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={saving}
          >
            <FileText className="h-4 w-4 mr-2" />
            Datei auswählen
          </Button>
          {fileName && (
            <span className="text-sm text-muted-foreground">{fileName}</span>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.csv"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Fehler</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {preview.length > 0 && !saved && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Folgende Felder werden ergänzt:</h4>
            <div className="space-y-2">
              {preview.map(m => (
                <div key={m.field} className="flex items-center justify-between p-2 bg-accent/50 rounded text-sm">
                  <span className="font-medium">{m.label}</span>
                  <Badge variant="secondary">{m.newValue}</Badge>
                </div>
              ))}
            </div>
            <Button onClick={handleApply} disabled={saving} className="w-full">
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Wird gespeichert...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4 mr-2" /> {preview.length} Felder übernehmen</>
              )}
            </Button>
          </div>
        )}

        {saved && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Erfolgreich</AlertTitle>
            <AlertDescription>
              {preview.length} Felder wurden aus der Personalstamm-Datei übernommen.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
