import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCompanySettings } from "@/hooks/use-company-settings";
import { useEmployees } from "@/contexts/employee-context";
import { useSupabasePayroll } from "@/hooks/use-supabase-payroll";
import { useToast } from "@/hooks/use-toast";
import {
  Building2, Users, Calculator, CheckCircle, ChevronRight,
  ArrowLeft, PartyPopper, Sparkles, Rocket
} from "lucide-react";

interface OnboardingWizardProps {
  onDismiss: () => void;
}

const steps = [
  { id: "welcome", title: "Willkommen", icon: Sparkles },
  { id: "company", title: "Ihre Firma", icon: Building2 },
  { id: "next-steps", title: "Geschafft!", icon: PartyPopper },
];

export function OnboardingWizard({ onDismiss }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [street, setStreet] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [city, setCity] = useState("");
  const [betriebsnummer, setBetriebsnummer] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { settings, saveSettings } = useCompanySettings();
  const { employees } = useEmployees();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Pre-fill if settings already exist
  useEffect(() => {
    if (settings) {
      setCompanyName(settings.company_name || "");
      setStreet(settings.street || "");
      setZipCode(settings.zip_code || "");
      setCity(settings.city || "");
      setBetriebsnummer(settings.betriebsnummer || "");
      setTaxNumber(settings.tax_number || "");
    }
  }, [settings]);

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleSaveCompany = async () => {
    if (!companyName.trim()) {
      toast({ title: "Bitte geben Sie einen Firmennamen ein", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const success = await saveSettings({
      company_name: companyName.trim(),
      street: street.trim() || null,
      zip_code: zipCode.trim() || null,
      city: city.trim() || null,
      betriebsnummer: betriebsnummer.trim() || null,
      tax_number: taxNumber.trim() || null,
    });
    setIsSaving(false);
    if (success) {
      toast({ title: "Firmendaten gespeichert!" });
      setCurrentStep(2);
    } else {
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    }
  };

  return (
    <Card className="border-2 border-primary/20 shadow-lg overflow-hidden">
      {/* Progress Bar */}
      <div className="bg-primary/5 px-6 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Einrichtungsassistent</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            Schritt {currentStep + 1} von {steps.length}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-2">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center gap-1">
              {i < currentStep ? (
                <CheckCircle className="h-3.5 w-3.5 text-primary" />
              ) : (
                <step.icon className={`h-3.5 w-3.5 ${i === currentStep ? "text-primary" : "text-muted-foreground"}`} />
              )}
              <span className={`text-xs ${i === currentStep ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      <CardContent className="p-6">
        {/* Step 0: Welcome */}
        {currentStep === 0 && (
          <div className="text-center py-4 space-y-4">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mx-auto">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              Willkommen bei LohnPro! 🎉
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              In wenigen Minuten ist alles eingerichtet. Wir führen Sie Schritt für Schritt
              durch die wichtigsten Einstellungen.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto pt-2">
              <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="text-xs text-muted-foreground text-center">Firmendaten eingeben</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-xs text-muted-foreground text-center">Mitarbeiter anlegen</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50">
                <Calculator className="h-5 w-5 text-primary" />
                <span className="text-xs text-muted-foreground text-center">Abrechnung starten</span>
              </div>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                Später einrichten
              </Button>
              <Button onClick={() => setCurrentStep(1)} className="gap-1">
                Los geht's <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 1: Company Data */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Ihre Firmendaten
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Geben Sie die Grunddaten Ihres Unternehmens ein. Sie können alles später noch ändern.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="onb-company">Firmenname *</Label>
                <Input
                  id="onb-company"
                  placeholder="z.B. Müller GmbH"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <Label htmlFor="onb-street">Straße & Nr.</Label>
                  <Input
                    id="onb-street"
                    placeholder="Hauptstraße 10"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="onb-zip">PLZ</Label>
                  <Input
                    id="onb-zip"
                    placeholder="80331"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    maxLength={5}
                  />
                </div>
                <div>
                  <Label htmlFor="onb-city">Stadt</Label>
                  <Input
                    id="onb-city"
                    placeholder="München"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="onb-bn">Betriebsnummer</Label>
                  <Input
                    id="onb-bn"
                    placeholder="8 Ziffern (optional)"
                    value={betriebsnummer}
                    onChange={(e) => setBetriebsnummer(e.target.value)}
                    maxLength={8}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Von der Bundesagentur für Arbeit. Können Sie später nachtragen.
                  </p>
                </div>
                <div>
                  <Label htmlFor="onb-tax">Steuernummer</Label>
                  <Input
                    id="onb-tax"
                    placeholder="z.B. 143/123/12345"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Vom Finanzamt. Können Sie später nachtragen.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setCurrentStep(0)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Zurück
              </Button>
              <Button onClick={handleSaveCompany} disabled={isSaving}>
                {isSaving ? "Speichern..." : "Speichern & weiter"} <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Done / Next Steps */}
        {currentStep === 2 && (
          <div className="text-center py-4 space-y-5">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-green-100 dark:bg-green-900/30 mx-auto">
              <PartyPopper className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              Super, Ihre Firma ist eingerichtet! 🎉
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Jetzt können Sie Ihren ersten Mitarbeiter anlegen und mit der Lohnabrechnung starten.
            </p>

            <div className="space-y-3 max-w-sm mx-auto text-left">
              <button
                onClick={() => { onDismiss(); navigate("/employees"); }}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
              >
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Ersten Mitarbeiter anlegen</p>
                  <p className="text-xs text-muted-foreground">Name, Steuerklasse, Gehalt eingeben</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
              </button>

              <button
                onClick={() => { onDismiss(); navigate("/settings"); }}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
              >
                <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Firmendaten ergänzen</p>
                  <p className="text-xs text-muted-foreground">Bankverbindung, Kontaktdaten hinzufügen</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
              </button>

              <button
                onClick={() => { onDismiss(); navigate("/hilfe"); }}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
              >
                <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Hilfe-Center öffnen</p>
                  <p className="text-xs text-muted-foreground">Anleitungen und Tipps für den Start</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
              </button>
            </div>

            <Button onClick={onDismiss} variant="outline" size="sm" className="mt-2">
              Zum Dashboard
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
