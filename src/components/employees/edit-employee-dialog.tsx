import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Employee, EmploymentType, TaxClass, RelationshipStatus, Religion, CHURCH_TAX_RATES, GERMAN_STATES, GERMAN_STATE_NAMES } from "@/types/employee";
import { Checkbox } from "@/components/ui/checkbox";

interface EditEmployeeDialogProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: Partial<Employee>) => void;
}

export function EditEmployeeDialog({ employee, open, onOpenChange, onSave }: EditEmployeeDialogProps) {
  const [formData, setFormData] = useState<Partial<Employee>>({});

  useEffect(() => {
    if (employee) {
      setFormData(employee);
    }
  }, [employee]);

  const handleSave = () => {
    if (formData && employee) {
      onSave(formData);
      onOpenChange(false);
    }
  };

  const updatePersonalData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      personalData: {
        ...prev.personalData!,
        [field]: value
      }
    }));
  };

  const updateEmploymentData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      employmentData: {
        ...prev.employmentData!,
        [field]: value
      }
    }));
  };

  const updateSalaryData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      salaryData: {
        ...prev.salaryData!,
        [field]: value
      }
    }));
  };

  const handleWorkDayChange = (dayIndex: number, isWorkDay: boolean) => {
    const currentWorkDays = formData.employmentData?.workDays || [];
    const updatedWorkDays = [...currentWorkDays];
    if (updatedWorkDays[dayIndex]) {
      updatedWorkDays[dayIndex] = { ...updatedWorkDays[dayIndex], isWorkDay };
    }
    updateEmploymentData("workDays", updatedWorkDays);
  };

  const getChurchTaxRate = () => {
    if (!formData.personalData?.religion || !formData.personalData?.address?.state) return 0;
    return CHURCH_TAX_RATES[formData.personalData.address.state]?.[formData.personalData.religion] || 0;
  };

  if (!employee || !formData.personalData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mitarbeiter bearbeiten</DialogTitle>
          <DialogDescription>
            Bearbeiten Sie die Daten von {employee.personalData.firstName} {employee.personalData.lastName}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Persönliche Daten</TabsTrigger>
            <TabsTrigger value="employment">Beschäftigung</TabsTrigger>
            <TabsTrigger value="salary">Gehalt</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Grunddaten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Vorname</Label>
                    <Input
                      id="firstName"
                      value={formData.personalData.firstName}
                      onChange={(e) => updatePersonalData('firstName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Nachname</Label>
                    <Input
                      id="lastName"
                      value={formData.personalData.lastName}
                      onChange={(e) => updatePersonalData('lastName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="relationshipStatus">Beziehungsstatus</Label>
                    <Select value={formData.personalData.relationshipStatus} onValueChange={(value) => updatePersonalData('relationshipStatus', value as RelationshipStatus)}>
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
                  {(formData.personalData.relationshipStatus === "married" || formData.personalData.relationshipStatus === "divorced" || formData.personalData.relationshipStatus === "widowed") && (
                    <div>
                      <Label htmlFor="relationshipDate">
                        {formData.personalData.relationshipStatus === "married" ? "Hochzeitsdatum" : 
                         formData.personalData.relationshipStatus === "divorced" ? "Scheidungsdatum" : "Todesdatum Partner"}
                      </Label>
                      <Input
                        id="relationshipDate"
                        type="date"
                        value={formData.personalData.relationshipDate ? new Date(formData.personalData.relationshipDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => updatePersonalData('relationshipDate', e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="religion">Religionszugehörigkeit</Label>
                    <Select value={formData.personalData.religion || 'none'} onValueChange={(value) => updatePersonalData('religion', value as Religion)}>
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="taxId">Steuer-ID</Label>
                    <Input
                      id="taxId"
                      value={formData.personalData.taxId}
                      onChange={(e) => updatePersonalData('taxId', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxClass">Steuerklasse</Label>
                    <Select value={formData.personalData.taxClass} onValueChange={(value) => updatePersonalData('taxClass', value as TaxClass)}>
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Beschäftigungsdaten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="employmentType">Beschäftigungsart</Label>
                    <Select value={formData.employmentData?.employmentType} onValueChange={(value) => updateEmploymentData('employmentType', value as EmploymentType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minijob">Minijob</SelectItem>
                        <SelectItem value="midijob">Midijob</SelectItem>
                        <SelectItem value="fulltime">Vollzeit</SelectItem>
                        <SelectItem value="parttime">Teilzeit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="weeklyHours">Wochenstunden</Label>
                    <Input
                      id="weeklyHours"
                      type="number"
                      value={formData.employmentData?.weeklyHours}
                      onChange={(e) => updateEmploymentData('weeklyHours', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vacationDays">Urlaubstage pro Jahr</Label>
                    <Input
                      id="vacationDays"
                      type="number"
                      min="20"
                      max="50"
                      value={formData.employmentData?.vacationDays || 30}
                      onChange={(e) => updateEmploymentData('vacationDays', parseInt(e.target.value) || 30)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Arbeitstage pro Woche</Label>
                  <div className="grid grid-cols-7 gap-2">
                    {(formData.employmentData?.workDays || []).map((workDay, index) => {
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
                  <Switch
                    id="isFixedTerm"
                    checked={formData.employmentData?.isFixedTerm}
                    onCheckedChange={(checked) => updateEmploymentData('isFixedTerm', checked)}
                  />
                  <Label htmlFor="isFixedTerm">Befristetes Arbeitsverhältnis</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="salary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gehaltsdaten</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="grossSalary">Bruttogehalt (€)</Label>
                  <Input
                    id="grossSalary"
                    type="number"
                    value={formData.salaryData?.grossSalary}
                    onChange={(e) => updateSalaryData('grossSalary', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="hourlyWage">Stundenlohn (€)</Label>
                  <Input
                    id="hourlyWage"
                    type="number"
                    step="0.01"
                    value={formData.salaryData?.hourlyWage || ''}
                    onChange={(e) => updateSalaryData('hourlyWage', parseFloat(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave}>
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}