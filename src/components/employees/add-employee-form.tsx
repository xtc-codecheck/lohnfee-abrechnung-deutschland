import { useState } from "react";
import { ArrowLeft, Save, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/ui/page-header";
import { EmploymentType, TaxClass, SalaryType } from "@/types/employee";
import { useEmployeeStorage } from "@/hooks/use-employee-storage";
import { useToast } from "@/hooks/use-toast";

interface AddEmployeeFormProps {
  onBack: () => void;
  onSave: (data: any) => void;
  onCalculate: (data: any) => void;
}

export function AddEmployeeForm({ onBack, onSave, onCalculate }: AddEmployeeFormProps) {
  const { addEmployee } = useEmployeeStorage();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    // Persönliche Daten
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    street: "",
    houseNumber: "",
    postalCode: "",
    city: "",
    taxId: "",
    taxClass: "I" as TaxClass,
    churchTax: false,
    churchTaxState: "",
    healthInsurance: "",
    healthInsuranceRate: 1.3,
    socialSecurityNumber: "",
    childAllowances: 0,
    
    // Beschäftigungsdaten
    employmentType: "fulltime" as EmploymentType,
    startDate: "",
    isFixedTerm: false,
    endDate: "",
    weeklyHours: 40,
    
    // Gehaltsdaten
    grossSalary: 0,
    hourlyWage: 0,
    salaryType: "fixed" as SalaryType,
    
    // Zusatzleistungen
    companyCar: 0,
    benefits: 0,
    travelExpenses: 0,
    bonuses: 0,
    allowances: 0,
    companyPension: 0,
    capitalFormingBenefits: 0,
    taxFreeBenefits: 0
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculate = () => {
    onCalculate(formData);
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Neuen Mitarbeiter hinzufügen"
        description="Erfassen Sie alle relevanten Daten für die Lohnabrechnung"
      >
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Button>
          <Button 
            onClick={handleCalculate}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Calculator className="h-4 w-4" />
            Berechnen
          </Button>
          <Button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-gradient-primary hover:opacity-90"
          >
            <Save className="h-4 w-4" />
            Speichern
          </Button>
        </div>
      </PageHeader>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Persönliche Daten</TabsTrigger>
          <TabsTrigger value="employment">Beschäftigung</TabsTrigger>
          <TabsTrigger value="salary">Gehalt</TabsTrigger>
          <TabsTrigger value="benefits">Zusatzleistungen</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Persönliche Daten</CardTitle>
              <CardDescription>Grundlegende Informationen zum Mitarbeiter</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Vorname*</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder="Max"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nachname*</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="Mustermann"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Geburtsdatum*</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="street">Straße*</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => handleInputChange("street", e.target.value)}
                    placeholder="Musterstraße"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="houseNumber">Nr.*</Label>
                  <Input
                    id="houseNumber"
                    value={formData.houseNumber}
                    onChange={(e) => handleInputChange("houseNumber", e.target.value)}
                    placeholder="123"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">PLZ*</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange("postalCode", e.target.value)}
                    placeholder="12345"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Stadt*</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="Berlin"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxId">Steuer-ID*</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => handleInputChange("taxId", e.target.value)}
                    placeholder="12345678901"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxClass">Steuerklasse*</Label>
                  <Select value={formData.taxClass} onValueChange={(value) => handleInputChange("taxClass", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="I">Klasse I</SelectItem>
                      <SelectItem value="II">Klasse II</SelectItem>
                      <SelectItem value="III">Klasse III</SelectItem>
                      <SelectItem value="IV">Klasse IV</SelectItem>
                      <SelectItem value="V">Klasse V</SelectItem>
                      <SelectItem value="VI">Klasse VI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="churchTax"
                  checked={formData.churchTax}
                  onCheckedChange={(checked) => handleInputChange("churchTax", checked)}
                />
                <Label htmlFor="churchTax">Kirchensteuerpflichtig</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="socialSecurityNumber">Sozialversicherungsnummer</Label>
                  <Input
                    id="socialSecurityNumber"
                    value={formData.socialSecurityNumber}
                    onChange={(e) => handleInputChange("socialSecurityNumber", e.target.value)}
                    placeholder="12345678901"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="childAllowances">Kinderfreibeträge</Label>
                  <Input
                    id="childAllowances"
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.childAllowances}
                    onChange={(e) => handleInputChange("childAllowances", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employment">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Beschäftigungsdaten</CardTitle>
              <CardDescription>Details zum Arbeitsverhältnis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="employmentType">Beschäftigungsart*</Label>
                <Select value={formData.employmentType} onValueChange={(value) => handleInputChange("employmentType", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minijob">Minijob (450€)</SelectItem>
                    <SelectItem value="midijob">Midijob (450-1300€)</SelectItem>
                    <SelectItem value="parttime">Teilzeit</SelectItem>
                    <SelectItem value="fulltime">Vollzeit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Eintrittsdatum*</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange("startDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weeklyHours">Wochenstunden*</Label>
                  <Input
                    id="weeklyHours"
                    type="number"
                    min="1"
                    max="60"
                    value={formData.weeklyHours}
                    onChange={(e) => handleInputChange("weeklyHours", parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isFixedTerm"
                  checked={formData.isFixedTerm}
                  onCheckedChange={(checked) => handleInputChange("isFixedTerm", checked)}
                />
                <Label htmlFor="isFixedTerm">Befristetes Arbeitsverhältnis</Label>
              </div>

              {formData.isFixedTerm && (
                <div className="space-y-2">
                  <Label htmlFor="endDate">Austrittsdatum</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange("endDate", e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salary">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Gehaltsdaten</CardTitle>
              <CardDescription>Grundvergütung und Lohnart</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="salaryType">Lohnart*</Label>
                <Select value={formData.salaryType} onValueChange={(value) => handleInputChange("salaryType", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Festgehalt</SelectItem>
                    <SelectItem value="hourly">Stundenlohn</SelectItem>
                    <SelectItem value="variable">Variabel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.salaryType === "fixed" && (
                <div className="space-y-2">
                  <Label htmlFor="grossSalary">Bruttogehalt pro Monat*</Label>
                  <Input
                    id="grossSalary"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.grossSalary}
                    onChange={(e) => handleInputChange("grossSalary", parseFloat(e.target.value) || 0)}
                    placeholder="4500.00"
                  />
                </div>
              )}

              {(formData.salaryType === "hourly" || formData.employmentType === "minijob") && (
                <div className="space-y-2">
                  <Label htmlFor="hourlyWage">Stundenlohn*</Label>
                  <Input
                    id="hourlyWage"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.hourlyWage}
                    onChange={(e) => handleInputChange("hourlyWage", parseFloat(e.target.value) || 0)}
                    placeholder="15.00"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="healthInsurance">Krankenkasse*</Label>
                  <Input
                    id="healthInsurance"
                    value={formData.healthInsurance}
                    onChange={(e) => handleInputChange("healthInsurance", e.target.value)}
                    placeholder="AOK"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="healthInsuranceRate">Zusatzbeitrag (%)</Label>
                  <Input
                    id="healthInsuranceRate"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.healthInsuranceRate}
                    onChange={(e) => handleInputChange("healthInsuranceRate", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benefits">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Zusatzleistungen</CardTitle>
              <CardDescription>Geldwerte Vorteile und weitere Lohnbestandteile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyCar">Firmenwagen (geldwerter Vorteil)</Label>
                  <Input
                    id="companyCar"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.companyCar}
                    onChange={(e) => handleInputChange("companyCar", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="benefits">Sachbezüge</Label>
                  <Input
                    id="benefits"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.benefits}
                    onChange={(e) => handleInputChange("benefits", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="travelExpenses">Fahrtkostenerstattung</Label>
                  <Input
                    id="travelExpenses"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.travelExpenses}
                    onChange={(e) => handleInputChange("travelExpenses", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bonuses">Boni/Prämien</Label>
                  <Input
                    id="bonuses"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.bonuses}
                    onChange={(e) => handleInputChange("bonuses", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyPension">Betriebliche Altersvorsorge (bAV)</Label>
                  <Input
                    id="companyPension"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.companyPension}
                    onChange={(e) => handleInputChange("companyPension", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capitalFormingBenefits">Vermögenswirksame Leistungen (VL)</Label>
                  <Input
                    id="capitalFormingBenefits"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.capitalFormingBenefits}
                    onChange={(e) => handleInputChange("capitalFormingBenefits", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxFreeBenefits">Steuerfreie Leistungen</Label>
                <Input
                  id="taxFreeBenefits"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.taxFreeBenefits}
                  onChange={(e) => handleInputChange("taxFreeBenefits", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}