import { useState } from "react";
import { Save, Building, Mail, Calendar, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AutolohnSettings, CompanyData } from "@/types/autolohn";
import { GERMAN_STATES, GERMAN_STATE_NAMES } from "@/types/employee";

export function AutolohnDashboard() {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<AutolohnSettings>({
    companyData: {
      name: "",
      street: "",
      houseNumber: "",
      postalCode: "",
      city: "",
      state: "nordrhein-westfalen",
      country: "Deutschland",
      taxNumber: "",
      operationNumber: ""
    },
    socialSecurityReporting: {
      enabled: true,
      daysBefore: 10
    },
    payrollTaxReporting: {
      enabled: true,
      dayOfNextMonth: 1
    },
    employeeNotifications: {
      enabled: true,
      sendOnPayrollCreation: true
    },
    managerNotifications: {
      enabled: true,
      managerEmail: "",
      daysBefore: 12
    }
  });

  const handleCompanyDataChange = (field: keyof CompanyData, value: string) => {
    setSettings(prev => ({
      ...prev,
      companyData: {
        ...prev.companyData,
        [field]: value
      }
    }));
  };

  const handleSocialSecurityChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      socialSecurityReporting: {
        ...prev.socialSecurityReporting,
        [field]: value
      }
    }));
  };

  const handlePayrollTaxChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      payrollTaxReporting: {
        ...prev.payrollTaxReporting,
        [field]: value
      }
    }));
  };

  const handleEmployeeNotificationsChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      employeeNotifications: {
        ...prev.employeeNotifications,
        [field]: value
      }
    }));
  };

  const handleManagerNotificationsChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      managerNotifications: {
        ...prev.managerNotifications,
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    // TODO: Hier würde die Speicherung der Einstellungen erfolgen
    console.log("Autolohn-Einstellungen speichern:", settings);
    toast({
      title: "Einstellungen gespeichert",
      description: "Die Autolohn-Einstellungen wurden erfolgreich gespeichert.",
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Zentrierter Header */}
      <div className="text-center pb-6 border-b border-border">
        <h1 className="text-3xl font-bold text-foreground">Autolohn-Einstellungen</h1>
        <p className="text-muted-foreground mt-2">Automatisierte Lohnabrechnung und Benachrichtigungen konfigurieren</p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="company">Unternehmensdaten</TabsTrigger>
          <TabsTrigger value="reporting">Meldungen</TabsTrigger>
          <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
          <TabsTrigger value="automation">Automatisierung</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Unternehmensdaten
              </CardTitle>
              <CardDescription>Grundlegende Informationen zu Ihrem Unternehmen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="companyName">Unternehmensname*</Label>
                <Input
                  id="companyName"
                  value={settings.companyData.name}
                  onChange={(e) => handleCompanyDataChange("name", e.target.value)}
                  placeholder="Musterfirma GmbH"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="companyStreet">Straße*</Label>
                  <Input
                    id="companyStreet"
                    value={settings.companyData.street}
                    onChange={(e) => handleCompanyDataChange("street", e.target.value)}
                    placeholder="Musterstraße"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyHouseNumber">Hausnummer*</Label>
                  <Input
                    id="companyHouseNumber"
                    value={settings.companyData.houseNumber}
                    onChange={(e) => handleCompanyDataChange("houseNumber", e.target.value)}
                    placeholder="123"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyPostalCode">PLZ*</Label>
                  <Input
                    id="companyPostalCode"
                    value={settings.companyData.postalCode}
                    onChange={(e) => handleCompanyDataChange("postalCode", e.target.value)}
                    placeholder="12345"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyCity">Stadt*</Label>
                  <Input
                    id="companyCity"
                    value={settings.companyData.city}
                    onChange={(e) => handleCompanyDataChange("city", e.target.value)}
                    placeholder="Berlin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyState">Bundesland*</Label>
                  <Select value={settings.companyData.state} onValueChange={(value) => handleCompanyDataChange("state", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Bundesland wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {GERMAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {GERMAN_STATE_NAMES[state]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyCountry">Land*</Label>
                  <Input
                    id="companyCountry"
                    value={settings.companyData.country}
                    onChange={(e) => handleCompanyDataChange("country", e.target.value)}
                    placeholder="Deutschland"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxNumber">Steuernummer*</Label>
                  <Input
                    id="taxNumber"
                    value={settings.companyData.taxNumber}
                    onChange={(e) => handleCompanyDataChange("taxNumber", e.target.value)}
                    placeholder="123/456/78901"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="operationNumber">Betriebsnummer (Bundesagentur für Arbeit)*</Label>
                  <Input
                    id="operationNumber"
                    value={settings.companyData.operationNumber}
                    onChange={(e) => handleCompanyDataChange("operationNumber", e.target.value)}
                    placeholder="12345678"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reporting">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Sozialversicherungsmeldung
                </CardTitle>
                <CardDescription>Automatische Meldung an die Sozialversicherung</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="socialSecurityEnabled"
                    checked={settings.socialSecurityReporting.enabled}
                    onCheckedChange={(checked) => handleSocialSecurityChange("enabled", checked)}
                  />
                  <Label htmlFor="socialSecurityEnabled">Automatische Meldung aktivieren</Label>
                </div>
                
                {settings.socialSecurityReporting.enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="socialSecurityDays">Tage vor Monatsende</Label>
                    <Input
                      id="socialSecurityDays"
                      type="number"
                      min="1"
                      max="30"
                      value={settings.socialSecurityReporting.daysBefore}
                      onChange={(e) => handleSocialSecurityChange("daysBefore", parseInt(e.target.value) || 10)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Empfohlen: 10 Tage vor Monatsende
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Lohnsteuermeldung
                </CardTitle>
                <CardDescription>Automatische Lohnsteuermeldung</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="payrollTaxEnabled"
                    checked={settings.payrollTaxReporting.enabled}
                    onCheckedChange={(checked) => handlePayrollTaxChange("enabled", checked)}
                  />
                  <Label htmlFor="payrollTaxEnabled">Automatische Meldung aktivieren</Label>
                </div>
                
                {settings.payrollTaxReporting.enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="payrollTaxDay">Tag im Folgemonat</Label>
                    <Input
                      id="payrollTaxDay"
                      type="number"
                      min="1"
                      max="31"
                      value={settings.payrollTaxReporting.dayOfNextMonth}
                      onChange={(e) => handlePayrollTaxChange("dayOfNextMonth", parseInt(e.target.value) || 1)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Gesetzlich: bis zum 10. des Folgemonats<br />
                      Empfohlen: 1. des Folgemonats für frühzeitige Bearbeitung
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Mitarbeiter-Benachrichtigungen
                </CardTitle>
                <CardDescription>Automatische E-Mail-Benachrichtigungen an Mitarbeiter</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="employeeNotificationsEnabled"
                    checked={settings.employeeNotifications.enabled}
                    onCheckedChange={(checked) => handleEmployeeNotificationsChange("enabled", checked)}
                  />
                  <Label htmlFor="employeeNotificationsEnabled">Benachrichtigungen aktivieren</Label>
                </div>
                
                {settings.employeeNotifications.enabled && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="sendOnPayrollCreation"
                        checked={settings.employeeNotifications.sendOnPayrollCreation}
                        onCheckedChange={(checked) => handleEmployeeNotificationsChange("sendOnPayrollCreation", checked)}
                      />
                      <Label htmlFor="sendOnPayrollCreation">Bei neuer Lohnabrechnung benachrichtigen</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Mitarbeiter erhalten automatisch eine E-Mail, wenn eine neue Lohnabrechnung verfügbar ist.
                      Nur Mitarbeiter mit hinterlegter E-Mail-Adresse werden benachrichtigt.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Manager-Benachrichtigungen
                </CardTitle>
                <CardDescription>Benachrichtigungen an Geschäftsführung/Inhaber</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="managerNotificationsEnabled"
                    checked={settings.managerNotifications.enabled}
                    onCheckedChange={(checked) => handleManagerNotificationsChange("enabled", checked)}
                  />
                  <Label htmlFor="managerNotificationsEnabled">Manager-Benachrichtigungen aktivieren</Label>
                </div>
                
                {settings.managerNotifications.enabled && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="managerEmail">E-Mail-Adresse Manager/Inhaber</Label>
                      <Input
                        id="managerEmail"
                        type="email"
                        value={settings.managerNotifications.managerEmail}
                        onChange={(e) => handleManagerNotificationsChange("managerEmail", e.target.value)}
                        placeholder="chef@unternehmen.de"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="managerDaysBefore">Tage vor Lohnabrechnungszeitraum</Label>
                      <Input
                        id="managerDaysBefore"
                        type="number"
                        min="1"
                        max="30"
                        value={settings.managerNotifications.daysBefore}
                        onChange={(e) => handleManagerNotificationsChange("daysBefore", parseInt(e.target.value) || 12)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Empfohlen: 12 Tage vor Lohnabrechnungszeitraum für Anpassungen bei Stundenlöhnen und neuen Mitarbeitern
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="automation">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Automatisierungs-Übersicht
              </CardTitle>
              <CardDescription>Übersicht aller automatisierten Prozesse</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Aktive Automatisierungen:</h4>
                  <div className="space-y-2 text-sm">
                    {settings.socialSecurityReporting.enabled && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Sozialversicherungsmeldung ({settings.socialSecurityReporting.daysBefore} Tage vor Monatsende)</span>
                      </div>
                    )}
                    {settings.payrollTaxReporting.enabled && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Lohnsteuermeldung (am {settings.payrollTaxReporting.dayOfNextMonth}. des Folgemonats)</span>
                      </div>
                    )}
                    {settings.employeeNotifications.enabled && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Mitarbeiter-Benachrichtigungen</span>
                      </div>
                    )}
                    {settings.managerNotifications.enabled && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Manager-Benachrichtigungen ({settings.managerNotifications.daysBefore} Tage vorher)</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Nächste Termine:</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Sozialversicherung: Automatisch berechnet</p>
                    <p>Lohnsteuer: Automatisch berechnet</p>
                    <p>Manager-Info: Automatisch berechnet</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-center">
        <Button 
          onClick={handleSave}
          className="flex items-center gap-2 bg-gradient-primary hover:opacity-90"
        >
          <Save className="h-4 w-4" />
          Einstellungen speichern
        </Button>
      </div>
    </div>
  );
}