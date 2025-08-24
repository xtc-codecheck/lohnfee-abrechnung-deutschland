import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Settings, Calculator } from "lucide-react";

interface TaxCalculationSettingsProps {
  onSettingsChange: (settings: TaxSettings) => void;
}

export interface TaxSettings {
  useMinijobCalculation: boolean;
  useMidijobCalculation: boolean;
  useStandardTaxTable: boolean;
  forceManualSelection: boolean;
}

export function TaxCalculationSettings({ onSettingsChange }: TaxCalculationSettingsProps) {
  const [settings, setSettings] = useState<TaxSettings>({
    useMinijobCalculation: false,
    useMidijobCalculation: false,
    useStandardTaxTable: true,
    forceManualSelection: true,
  });

  const handleSettingChange = (key: keyof TaxSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    
    // Logik: Wenn Minijob oder Midijob aktiviert wird, Standard-Tabelle deaktivieren
    if (key === 'useMinijobCalculation' && value) {
      newSettings.useStandardTaxTable = false;
      newSettings.useMidijobCalculation = false;
    } else if (key === 'useMidijobCalculation' && value) {
      newSettings.useStandardTaxTable = false;
      newSettings.useMinijobCalculation = false;
    } else if (key === 'useStandardTaxTable' && value) {
      newSettings.useMinijobCalculation = false;
      newSettings.useMidijobCalculation = false;
    }

    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Steuerberechnungs-Einstellungen
        </CardTitle>
        <CardDescription>
          Wählen Sie die Art der Steuerberechnung für die Lohnabrechnung
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Wichtig:</strong> Die Steuerberechnung muss explizit ausgewählt werden. 
            Standardmäßig erfolgt die Berechnung nach der allgemeinen Lohnsteuertabelle.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Allgemeine Lohnsteuertabelle</Label>
              <p className="text-sm text-muted-foreground">
                Standard für sozialversicherungspflichtige Arbeitnehmer
              </p>
            </div>
            <Switch
              checked={settings.useStandardTaxTable}
              onCheckedChange={(checked) => handleSettingChange('useStandardTaxTable', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Minijob-Berechnung</Label>
              <p className="text-sm text-muted-foreground">
                Bis 556€/Monat - Pauschalsteuer 2%, keine SV-Beiträge
              </p>
            </div>
            <Switch
              checked={settings.useMinijobCalculation}
              onCheckedChange={(checked) => handleSettingChange('useMinijobCalculation', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Midijob-Berechnung</Label>
              <p className="text-sm text-muted-foreground">
                556,01€ - 2.000€/Monat - Gleitzonenformel, reduzierte SV-Beiträge
              </p>
            </div>
            <Switch
              checked={settings.useMidijobCalculation}
              onCheckedChange={(checked) => handleSettingChange('useMidijobCalculation', checked)}
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Manuelle Auswahl erzwingen</Label>
                <p className="text-sm text-muted-foreground">
                  Verhindert automatische Erkennung basierend auf Gehalt
                </p>
              </div>
              <Switch
                checked={settings.forceManualSelection}
                onCheckedChange={(checked) => handleSettingChange('forceManualSelection', checked)}
              />
            </div>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="h-4 w-4" />
            <span className="font-medium">Aktuelle Einstellung:</span>
          </div>
          <p className="text-sm">
            {settings.useStandardTaxTable && "Allgemeine Lohnsteuertabelle aktiviert"}
            {settings.useMinijobCalculation && "Minijob-Berechnung aktiviert"}
            {settings.useMidijobCalculation && "Midijob-Berechnung aktiviert"}
            {!settings.useStandardTaxTable && !settings.useMinijobCalculation && !settings.useMidijobCalculation && 
             "Keine Berechnungsmethode ausgewählt"}
          </p>
          {settings.forceManualSelection && (
            <p className="text-xs text-muted-foreground mt-1">
              Manuelle Auswahl ist erzwungen - automatische Erkennung deaktiviert
            </p>
          )}
        </div>

        <Alert>
          <AlertDescription>
            <strong>Hinweis zur besonderen Lohnsteuertabelle:</strong> 
            Für Beamte, Richter und privat Krankenversicherte steht derzeit die besondere 
            Lohnsteuertabelle noch nicht zur Verfügung. Diese wird in einer späteren Version implementiert.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}