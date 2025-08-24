import { useState } from "react";
import { Calendar, Check, Save, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useEmployeeStorage } from "@/hooks/use-employee-storage";

interface ManualPayrollData {
  employeeId: string;
  regularHours: number;
  overtimeHours: number;
  nightHours: number;
  sundayHours: number;
  holidayHours: number;
  vacationDays: number;
  sickDays: number;
  bonuses: number;
  deductions: number;
  notes: string;
}

interface ManualPayrollEntryProps {
  selectedMonth?: number;
  selectedYear?: number;
}

export function ManualPayrollEntry({ 
  selectedMonth = new Date().getMonth() + 1, 
  selectedYear = new Date().getFullYear() 
}: ManualPayrollEntryProps) {
  const { toast } = useToast();
  const { employees } = useEmployeeStorage();
  const [payrollData, setPayrollData] = useState<Record<string, ManualPayrollData>>({});
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  const initializeEmployeeData = (employeeId: string) => {
    if (!payrollData[employeeId]) {
      setPayrollData(prev => ({
        ...prev,
        [employeeId]: {
          employeeId,
          regularHours: 0,
          overtimeHours: 0,
          nightHours: 0,
          sundayHours: 0,
          holidayHours: 0,
          vacationDays: 0,
          sickDays: 0,
          bonuses: 0,
          deductions: 0,
          notes: ''
        }
      }));
    }
  };

  const updateEmployeeData = (employeeId: string, field: keyof ManualPayrollData, value: string | number) => {
    setPayrollData(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: typeof value === 'string' ? value : Number(value)
      }
    }));
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    if (selectedEmployees.includes(employeeId)) {
      setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
    } else {
      setSelectedEmployees(prev => [...prev, employeeId]);
      initializeEmployeeData(employeeId);
    }
  };

  const calculateTotalHours = (data: ManualPayrollData) => {
    return data.regularHours + data.overtimeHours + data.nightHours + data.sundayHours + data.holidayHours;
  };

  const handleSavePayroll = async () => {
    setIsSaving(true);
    
    try {
      // Hier würde die tatsächliche Speicherung erfolgen
      // Simulation der Speicherung
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Manuelle Abrechnung gespeichert",
        description: `Abrechnung für ${monthNames[selectedMonth - 1]} ${selectedYear} wurde erfolgreich gespeichert.`,
      });

      // Reset nach erfolgreichem Speichern
      setPayrollData({});
      setSelectedEmployees([]);
      
    } catch (error) {
      toast({
        title: "Fehler beim Speichern",
        description: "Die Abrechnung konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Manuelle Lohnabrechnung
          </CardTitle>
          <CardDescription>
            Manuelle Erfassung von Arbeitszeiten und Zuschlägen für {monthNames[selectedMonth - 1]} {selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Diese manuelle Eingabe ergänzt das automatisierte System. Bitte alle Angaben sorgfältig prüfen.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Mitarbeiterauswahl
          </CardTitle>
          <CardDescription>
            Wählen Sie die Mitarbeiter für die manuelle Abrechnung aus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {employees.map((employee) => (
              <div
                key={employee.id}
                onClick={() => toggleEmployeeSelection(employee.id)}
                className={`
                  p-4 border rounded-lg cursor-pointer transition-all
                  ${selectedEmployees.includes(employee.id) 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {employee.personalData.firstName} {employee.personalData.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {employee.employmentData.department}
                    </p>
                  </div>
                  {selectedEmployees.includes(employee.id) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
                <Badge variant="secondary" className="mt-2">
                  {employee.employmentData.employmentType === 'fulltime' ? 'Vollzeit' :
                   employee.employmentData.employmentType === 'parttime' ? 'Teilzeit' :
                   employee.employmentData.employmentType === 'minijob' ? 'Minijob' : 'Midijob'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedEmployees.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Arbeitszeit-Erfassung</CardTitle>
            <CardDescription>
              Tragen Sie die Arbeitszeiten und Zuschläge für die ausgewählten Mitarbeiter ein
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Mitarbeiter</TableHead>
                    <TableHead className="text-center min-w-[100px]">Reguläre Std.</TableHead>
                    <TableHead className="text-center min-w-[100px]">Überstunden</TableHead>
                    <TableHead className="text-center min-w-[100px]">Nachtarbeit</TableHead>
                    <TableHead className="text-center min-w-[100px]">Sonntag</TableHead>
                    <TableHead className="text-center min-w-[100px]">Feiertag</TableHead>
                    <TableHead className="text-center min-w-[100px]">Urlaub (Tage)</TableHead>
                    <TableHead className="text-center min-w-[100px]">Krank (Tage)</TableHead>
                    <TableHead className="text-center min-w-[100px]">Boni (€)</TableHead>
                    <TableHead className="text-center min-w-[100px]">Abzüge (€)</TableHead>
                    <TableHead className="min-w-[150px]">Notizen</TableHead>
                    <TableHead className="text-center">Gesamt Std.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedEmployees.map((employeeId) => {
                    const employee = employees.find(e => e.id === employeeId);
                    const data = payrollData[employeeId];
                    
                    if (!employee || !data) return null;

                    return (
                      <TableRow key={employeeId}>
                        <TableCell className="font-medium">
                          <div>
                            <p>{employee.personalData.firstName} {employee.personalData.lastName}</p>
                            <p className="text-sm text-muted-foreground">
                              {employee.salaryData.grossSalary.toLocaleString('de-DE', { 
                                style: 'currency', 
                                currency: 'EUR' 
                              })}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            value={data.regularHours}
                            onChange={(e) => updateEmployeeData(employeeId, 'regularHours', e.target.value)}
                            className="text-center"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            value={data.overtimeHours}
                            onChange={(e) => updateEmployeeData(employeeId, 'overtimeHours', e.target.value)}
                            className="text-center"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            value={data.nightHours}
                            onChange={(e) => updateEmployeeData(employeeId, 'nightHours', e.target.value)}
                            className="text-center"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            value={data.sundayHours}
                            onChange={(e) => updateEmployeeData(employeeId, 'sundayHours', e.target.value)}
                            className="text-center"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            value={data.holidayHours}
                            onChange={(e) => updateEmployeeData(employeeId, 'holidayHours', e.target.value)}
                            className="text-center"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={data.vacationDays}
                            onChange={(e) => updateEmployeeData(employeeId, 'vacationDays', e.target.value)}
                            className="text-center"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={data.sickDays}
                            onChange={(e) => updateEmployeeData(employeeId, 'sickDays', e.target.value)}
                            className="text-center"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={data.bonuses}
                            onChange={(e) => updateEmployeeData(employeeId, 'bonuses', e.target.value)}
                            className="text-center"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={data.deductions}
                            onChange={(e) => updateEmployeeData(employeeId, 'deductions', e.target.value)}
                            className="text-center"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            value={data.notes}
                            onChange={(e) => updateEmployeeData(employeeId, 'notes', e.target.value)}
                            placeholder="Bemerkungen..."
                          />
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {calculateTotalHours(data).toFixed(1)}h
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end mt-6">
              <Button 
                onClick={handleSavePayroll}
                disabled={isSaving || selectedEmployees.length === 0}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Speichere...' : 'Manuelle Abrechnung speichern'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}