import { useState } from "react";
import { Building2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useCompanySettings } from "@/hooks/use-company-settings";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";

export function CompanySettingsPage() {
  const { settings, isLoading, saveSettings } = useCompanySettings();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    company_name: '',
    street: '',
    zip_code: '',
    city: '',
    tax_number: '',
    tax_office: '',
    betriebsnummer: '',
    iban: '',
    bic: '',
    bank_name: '',
    contact_email: '',
    contact_phone: '',
    besonderheiten: '',
  });

  // Sync form when settings load
  const [initialized, setInitialized] = useState(false);
  if (settings && !initialized) {
    setForm({
      company_name: settings.company_name ?? '',
      street: settings.street ?? '',
      zip_code: settings.zip_code ?? '',
      city: settings.city ?? '',
      tax_number: settings.tax_number ?? '',
      tax_office: settings.tax_office ?? '',
      betriebsnummer: settings.betriebsnummer ?? '',
      iban: settings.iban ?? '',
      bic: settings.bic ?? '',
      bank_name: settings.bank_name ?? '',
      contact_email: settings.contact_email ?? '',
      contact_phone: settings.contact_phone ?? '',
      besonderheiten: (settings as any).besonderheiten ?? '',
    });
    setInitialized(true);
  }

  const handleSave = async () => {
    setSaving(true);
    const ok = await saveSettings(form);
    setSaving(false);
    toast({
      title: ok ? "Gespeichert" : "Fehler",
      description: ok ? "Firmenstammdaten wurden gespeichert." : "Fehler beim Speichern.",
      variant: ok ? "default" : "destructive",
    });
  };

  const readOnly = !isAdmin();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const Field = ({ label, field, placeholder }: { label: string; field: keyof typeof form; placeholder?: string }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={form[field]}
        onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
        placeholder={placeholder}
        disabled={readOnly}
      />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Firmenstammdaten"
        description="Firmeninformationen für Abrechnungen und offizielle Dokumente"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Firma</CardTitle>
            <CardDescription>Name und Adresse des Unternehmens</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Firmenname *" field="company_name" placeholder="Musterfirma GmbH" />
            <Field label="Straße & Hausnr." field="street" placeholder="Musterstraße 1" />
            <div className="grid grid-cols-3 gap-3">
              <Field label="PLZ" field="zip_code" placeholder="12345" />
              <div className="col-span-2">
                <Field label="Ort" field="city" placeholder="Musterstadt" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Steuer & Sozialversicherung</CardTitle>
            <CardDescription>Pflichtangaben für Abrechnungen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Steuernummer" field="tax_number" placeholder="12/345/67890" />
            <Field label="Finanzamt" field="tax_office" placeholder="Finanzamt Musterstadt" />
            <Field label="Betriebsnummer" field="betriebsnummer" placeholder="12345678" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bankverbindung</CardTitle>
            <CardDescription>Für Gehaltszahlungen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="IBAN" field="iban" placeholder="DE89 3704 0044 0532 0130 00" />
            <Field label="BIC" field="bic" placeholder="COBADEFFXXX" />
            <Field label="Bankname" field="bank_name" placeholder="Commerzbank" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kontakt</CardTitle>
            <CardDescription>Ansprechpartner</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="E-Mail" field="contact_email" placeholder="lohn@firma.de" />
            <Field label="Telefon" field="contact_phone" placeholder="+49 123 456789" />
          </CardContent>
        </Card>
      </div>

      {!readOnly && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || !form.company_name}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Speichern
          </Button>
        </div>
      )}
    </div>
  );
}
