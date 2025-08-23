import { useState } from "react";
import { ArrowLeft, Save, Calculator, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/ui/page-header";
import { EmploymentType, TaxClass, SalaryType, RelationshipStatus, Religion, CHURCH_TAX_RATES, GERMAN_STATES, GERMAN_STATE_NAMES, GERMAN_HEALTH_INSURANCES, SOCIAL_SECURITY_RATES } from "@/types/employee";
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
    state: "nordrhein-westfalen",
    country: "Deutschland",
    phone: "",
    email: "",
    taxId: "",
    taxClass: "I" as TaxClass,
    religion: "none" as Religion,
    relationshipStatus: "single" as RelationshipStatus,
    relationshipDate: "",
    healthInsurance: "",
    healthInsuranceRate: 2.45,
    socialSecurityNumber: "",
    childAllowances: 0,
    
    // Beschäftigungsdaten
    employmentType: "fulltime" as EmploymentType,
    startDate: "",
    isFixedTerm: false,
    endDate: "",
    weeklyHours: 40,
    vacationDays: 30,
    workDays: [
      { day: 'monday', isWorkDay: true },
      { day: 'tuesday', isWorkDay: true },
      { day: 'wednesday', isWorkDay: true },
      { day: 'thursday', isWorkDay: true },
      { day: 'friday', isWorkDay: true },
      { day: 'saturday', isWorkDay: false },
      { day: 'sunday', isWorkDay: false }
    ],
    
    // Gehaltsdaten
    grossSalary: 0,
    hourlyWage: 0,
    salaryType: "fixed" as SalaryType,
    
    // Zusatzleistungen
    carListPrice: 0,
    carType: "benzin" as "benzin" | "elektro" | "hybrid",
    benefits: 0,
    benefitsCompliant: false,
    travelExpenses: 0,
    bonuses: 0,
    yearlyBonusPercent: 0,
    yearlyBonusFixed: 0,
    has13thSalary: false,
    factor13thSalary: 1,
    has14thSalary: false,
    factor14thSalary: 1,
    allowances: 0,
    companyPension: 0,
    capitalFormingBenefits: 0,
    taxFreeBenefits: 0
  });
  const [openHealthInsurance, setOpenHealthInsurance] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculate = () => {
    onCalculate(formData);
  };

  const handleSave = () => {
    onSave(formData);
  };

  const handleWorkDayChange = (dayIndex: number, isWorkDay: boolean) => {
    const updatedWorkDays = [...formData.workDays];
    updatedWorkDays[dayIndex] = { ...updatedWorkDays[dayIndex], isWorkDay };
    handleInputChange("workDays", updatedWorkDays);
  };

  const getChurchTaxRate = () => {
    if (!formData.religion || !formData.state) return 0;
    return CHURCH_TAX_RATES[formData.state]?.[formData.religion] || 0;
  };

  const calculateCarBenefit = () => {
    if (!formData.carListPrice) return 0;
    
    let rate = 0;
    switch (formData.carType) {
      case "benzin":
        rate = 1; // 1% monatlich
        break;
      case "elektro":
        rate = formData.carListPrice <= 80000 ? 0.25 : 0.5; // 0,25% bis 80.000€, 0,5% über 80.000€ monatlich
        break;
      case "hybrid":
        rate = 0.5; // 0,5% monatlich
        break;
    }
    return (formData.carListPrice * rate) / 100;
  };

  const handleHealthInsuranceSelect = (insuranceName: string) => {
    const selectedInsurance = GERMAN_HEALTH_INSURANCES.find(ins => ins.name === insuranceName);
    handleInputChange("healthInsurance", insuranceName);
    if (selectedInsurance) {
      handleInputChange("healthInsuranceRate", selectedInsurance.additionalRate);
    }
    setOpenHealthInsurance(false);
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Stadt*</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="Berlin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Bundesland*</Label>
                  <Select value={formData.state} onValueChange={(value) => handleInputChange("state", value)}>
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
                  <Label htmlFor="country">Land*</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                    placeholder="Deutschland"
                  />
                </div>
              </div>

              {/* Telefon und E-Mail */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefonnummer</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+49 123 456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail-Adresse</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="max.mustermann@email.de"
                  />
                </div>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="relationshipStatus">Beziehungsstatus*</Label>
                  <Select value={formData.relationshipStatus} onValueChange={(value) => handleInputChange("relationshipStatus", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Ledig</SelectItem>
                      <SelectItem value="married">Verheiratet</SelectItem>
                      <SelectItem value="divorced">Geschieden</SelectItem>
                      <SelectItem value="widowed">Verwitwet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="religion">Religionszugehörigkeit</Label>
                  <Select value={formData.religion} onValueChange={(value) => handleInputChange("religion", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Keine/Andere</SelectItem>
                      <SelectItem value="catholic">Römisch-katholisch</SelectItem>
                      <SelectItem value="protestant">Evangelisch</SelectItem>
                      <SelectItem value="old-catholic">Altkatholische Kirche</SelectItem>
                      <SelectItem value="jewish">Jüdische Kultusgemeinden</SelectItem>
                      <SelectItem value="free-religious">Freireligiöse Gemeinden</SelectItem>
                      <SelectItem value="unitarian">Unitarische Religionsgemeinschaft</SelectItem>
                      <SelectItem value="mennonite">Mennonitengemeinde</SelectItem>
                      <SelectItem value="huguenot">Französische Kirche (Hugenotten)</SelectItem>
                      <SelectItem value="other">Sonstige</SelectItem>
                    </SelectContent>
                  </Select>
                  {getChurchTaxRate() > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Kirchensteuersatz: {getChurchTaxRate()}%
                    </div>
                  )}
                </div>
                {(formData.relationshipStatus === "married" || formData.relationshipStatus === "divorced" || formData.relationshipStatus === "widowed") && (
                  <div className="space-y-2">
                    <Label htmlFor="relationshipDate">
                      {formData.relationshipStatus === "married" ? "Hochzeitsdatum" : 
                       formData.relationshipStatus === "divorced" ? "Scheidungsdatum" : "Todesdatum Partner"}
                    </Label>
                    <Input
                      id="relationshipDate"
                      type="date"
                      value={formData.relationshipDate}
                      onChange={(e) => handleInputChange("relationshipDate", e.target.value)}
                    />
                  </div>
                )}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="vacationDays">Urlaubstage pro Jahr*</Label>
                  <Input
                    id="vacationDays"
                    type="number"
                    min="20"
                    max="50"
                    value={formData.vacationDays}
                    onChange={(e) => handleInputChange("vacationDays", parseInt(e.target.value) || 20)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Arbeitstage pro Woche*</Label>
                <div className="grid grid-cols-7 gap-2">
                  {formData.workDays.map((workDay, index) => {
                    const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
                    const dayNamesFull = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
                    return (
                      <div key={workDay.day} className="flex flex-col items-center space-y-2">
                        <Label className="text-sm font-medium">{dayNames[index]}</Label>
                        <Checkbox
                          id={`workDay-${workDay.day}`}
                          checked={workDay.isWorkDay}
                          onCheckedChange={(checked) => handleWorkDayChange(index, !!checked)}
                        />
                        <Label htmlFor={`workDay-${workDay.day}`} className="text-xs text-muted-foreground sr-only">
                          {dayNamesFull[index]}
                        </Label>
                      </div>
                    );
                  })}
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

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="healthInsurance">Krankenkasse*</Label>
                  <Popover open={openHealthInsurance} onOpenChange={setOpenHealthInsurance}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openHealthInsurance}
                        className="w-full justify-between"
                      >
                        {formData.healthInsurance
                          ? GERMAN_HEALTH_INSURANCES.find((insurance) => insurance.name === formData.healthInsurance)?.name
                          : "Krankenkasse wählen..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Krankenkasse suchen..." />
                        <CommandList>
                          <CommandEmpty>Keine Krankenkasse gefunden.</CommandEmpty>
                          <CommandGroup>
                            {GERMAN_HEALTH_INSURANCES.map((insurance) => (
                              <CommandItem
                                key={insurance.name}
                                value={insurance.name}
                                onSelect={handleHealthInsuranceSelect}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.healthInsurance === insurance.name ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex-1">
                                  <div>{insurance.name}</div>
                                  <div className="text-sm text-muted-foreground">Zusatzbeitrag: {insurance.additionalRate}%</div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="healthInsuranceRate">Zusatzbeitrag (%)*</Label>
                  <Input
                    id="healthInsuranceRate"
                    type="number"
                    min="0"
                    max="5"
                    step="0.01"
                    value={formData.healthInsuranceRate}
                    onChange={(e) => handleInputChange("healthInsuranceRate", parseFloat(e.target.value) || 0)}
                  />
                  <div className="text-xs text-muted-foreground">
                    Wird automatisch bei Krankenkassenwahl ausgefüllt, kann aber angepasst werden
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <div className="font-medium text-sm">Sozialversicherungssätze 2025</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <div className="font-medium">Rentenversicherung</div>
                      <div className="text-muted-foreground">
                        Gesamt: {SOCIAL_SECURITY_RATES.pension.total}%<br />
                        (AG: {SOCIAL_SECURITY_RATES.pension.employer}% | AN: {SOCIAL_SECURITY_RATES.pension.employee}%)
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Arbeitslosenversicherung</div>
                      <div className="text-muted-foreground">
                        Gesamt: {SOCIAL_SECURITY_RATES.unemployment.total}%<br />
                        (AG: {SOCIAL_SECURITY_RATES.unemployment.employer}% | AN: {SOCIAL_SECURITY_RATES.unemployment.employee}%)
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Pflegeversicherung</div>
                      <div className="text-muted-foreground">
                        Gesamt: {SOCIAL_SECURITY_RATES.care.total}%<br />
                        (AG: {SOCIAL_SECURITY_RATES.care.employer}% | AN: {SOCIAL_SECURITY_RATES.care.employee}%)
                        <br />
                        <span className="text-xs">+ 0.6% Kinderlosenzuschlag ab 23 Jahre</span>
                      </div>
                    </div>
                  </div>
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
                  <Label htmlFor="carListPrice">Bruttolistenpreis des Kfz</Label>
                  <Input
                    id="carListPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.carListPrice}
                    onChange={(e) => handleInputChange("carListPrice", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carType">Fahrzeugtyp</Label>
                  <Select value={formData.carType} onValueChange={(value) => handleInputChange("carType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Fahrzeugtyp wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="benzin">Benzin/Diesel (1%)</SelectItem>
                      <SelectItem value="elektro">Elektrofahrzeug (0,25% bis 80.000€, 0,5% über 80.000€)</SelectItem>
                      <SelectItem value="hybrid">Hybrid (0,5%)</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.carListPrice > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Geldwerter Vorteil: {calculateCarBenefit().toFixed(2)}€ pro Monat
                    </div>
                  )}
                </div>
              </div>

              {/* Boni/Prämien - direkt nach Bruttolistenpreis */}
              <div className="space-y-2">
                <Label htmlFor="bonuses">Boni/Prämien</Label>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="yearlyBonusPercent" className="text-sm">Jahresboni (%)</Label>
                      <Input
                        id="yearlyBonusPercent"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.yearlyBonusPercent}
                        onChange={(e) => handleInputChange("yearlyBonusPercent", parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="yearlyBonusFixed" className="text-sm">Jahresboni fix (€)</Label>
                      <Input
                        id="yearlyBonusFixed"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.yearlyBonusFixed}
                        onChange={(e) => handleInputChange("yearlyBonusFixed", parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="has13thSalary"
                          checked={formData.has13thSalary}
                          onCheckedChange={(checked) => handleInputChange("has13thSalary", checked)}
                        />
                        <Label htmlFor="has13thSalary" className="text-sm">13. Monatsgehalt</Label>
                      </div>
                      {formData.has13thSalary && (
                        <div>
                          <Label htmlFor="factor13thSalary" className="text-xs">Faktor</Label>
                          <Input
                            id="factor13thSalary"
                            type="number"
                            min="0"
                            max="2"
                            step="0.1"
                            value={formData.factor13thSalary}
                            onChange={(e) => handleInputChange("factor13thSalary", parseFloat(e.target.value) || 1)}
                            placeholder="1.0"
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="has14thSalary"
                          checked={formData.has14thSalary}
                          onCheckedChange={(checked) => handleInputChange("has14thSalary", checked)}
                        />
                        <Label htmlFor="has14thSalary" className="text-sm">14. Monatsgehalt</Label>
                      </div>
                      {formData.has14thSalary && (
                        <div>
                          <Label htmlFor="factor14thSalary" className="text-xs">Faktor</Label>
                          <Input
                            id="factor14thSalary"
                            type="number"
                            min="0"
                            max="2"
                            step="0.1"
                            value={formData.factor14thSalary}
                            onChange={(e) => handleInputChange("factor14thSalary", parseFloat(e.target.value) || 1)}
                            placeholder="1.0"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sachbezüge */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="benefitsCompliant"
                      checked={formData.benefitsCompliant}
                      onCheckedChange={(checked) => handleInputChange("benefitsCompliant", checked)}
                    />
                    <Label htmlFor="benefitsCompliant" className="text-sm">Compliance-Check (z.B. Gutscheinkarte erfüllt)</Label>
                  </div>
                </div>
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