import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Heart, Baby, Users, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useEmployeeStorage } from "@/hooks/use-employee-storage";
import { useSpecialPayments } from "@/hooks/use-special-payments";
import { calculateSickPay, calculateMaternityBenefits, calculateShortTimeWork } from "@/utils/special-payments-calculation";
import { Employee } from "@/types/employee";

interface SpecialPaymentsManagerProps {
  onBack: () => void;
}

export function SpecialPaymentsManager({ onBack }: SpecialPaymentsManagerProps) {
  const { employees } = useEmployeeStorage();
  const {
    sickPayments,
    maternityBenefits,
    shortTimeWork,
    addSickPayment,
    addMaternityBenefit,
    addShortTimeWork,
    updateSickPayment,
    updateMaternityBenefit,
    updateShortTimeWork,
    deleteSickPayment,
    deleteMaternityBenefit,
    deleteShortTimeWork,
  } = useSpecialPayments();

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [dialogType, setDialogType] = useState<'sick' | 'maternity' | 'short-time' | null>(null);
  const [formData, setFormData] = useState({
    startDate: new Date(),
    endDate: new Date(),
    type: 'maternity-protection' as 'maternity-protection' | 'parental-leave',
    originalHours: 40,
    reducedHours: 20,
    hasChildren: false,
  });

  const handleCreateSickPay = () => {
    if (!selectedEmployee) return;

    const calculation = calculateSickPay({
      employee: selectedEmployee,
      startDate: formData.startDate,
      endDate: formData.endDate,
      grossSalary: selectedEmployee.salaryData.grossSalary,
    });

    addSickPayment(calculation);
    setDialogType(null);
    setSelectedEmployee(null);
  };

  const handleCreateMaternityBenefit = () => {
    if (!selectedEmployee) return;

    const calculation = calculateMaternityBenefits({
      employee: selectedEmployee,
      startDate: formData.startDate,
      endDate: formData.endDate,
      grossSalary: selectedEmployee.salaryData.grossSalary,
      type: formData.type,
    });

    addMaternityBenefit(calculation);
    setDialogType(null);
    setSelectedEmployee(null);
  };

  const handleCreateShortTimeWork = () => {
    if (!selectedEmployee) return;

    const calculation = calculateShortTimeWork({
      employee: selectedEmployee,
      startDate: formData.startDate,
      endDate: formData.endDate,
      originalHours: formData.originalHours,
      reducedHours: formData.reducedHours,
      grossSalary: selectedEmployee.salaryData.grossSalary,
      hasChildren: formData.hasChildren,
    });

    addShortTimeWork(calculation);
    setDialogType(null);
    setSelectedEmployee(null);
  };

  const DatePicker = ({ 
    date, 
    onDateChange, 
    placeholder 
  }: { 
    date: Date; 
    onDateChange: (date: Date) => void; 
    placeholder: string 
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP", { locale: de }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(date) => date && onDateChange(date)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        <h1 className="text-3xl font-bold">Spezielle Lohnarten</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Dialog open={dialogType === 'sick'} onOpenChange={(open) => !open && setDialogType(null)}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Krankengeld
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  70% Bruttogehalt, max. 90% Netto
                </p>
                <Button 
                  className="w-full" 
                  onClick={() => setDialogType('sick')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Neue Krankmeldung
                </Button>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Krankengeld berechnen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Mitarbeiter</Label>
                <Select onValueChange={(value) => {
                  const employee = employees.find(e => e.id === value);
                  setSelectedEmployee(employee || null);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mitarbeiter auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(employee => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.personalData.firstName} {employee.personalData.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Beginn</Label>
                  <DatePicker
                    date={formData.startDate}
                    onDateChange={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                    placeholder="Datum wählen"
                  />
                </div>
                <div>
                  <Label>Ende</Label>
                  <DatePicker
                    date={formData.endDate}
                    onDateChange={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                    placeholder="Datum wählen"
                  />
                </div>
              </div>
              <Button onClick={handleCreateSickPay} className="w-full" disabled={!selectedEmployee}>
                Krankengeld berechnen
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={dialogType === 'maternity'} onOpenChange={(open) => !open && setDialogType(null)}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Baby className="h-5 w-5 text-pink-500" />
                  Mutterschutz/Elternzeit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Mutterschaftsgeld & Elterngeld
                </p>
                <Button 
                  className="w-full" 
                  onClick={() => setDialogType('maternity')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Neue Meldung
                </Button>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mutterschutz/Elternzeit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Mitarbeiter</Label>
                <Select onValueChange={(value) => {
                  const employee = employees.find(e => e.id === value);
                  setSelectedEmployee(employee || null);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mitarbeiter auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(employee => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.personalData.firstName} {employee.personalData.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Art</Label>
                <Select value={formData.type} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, type: value as 'maternity-protection' | 'parental-leave' }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maternity-protection">Mutterschutz</SelectItem>
                    <SelectItem value="parental-leave">Elternzeit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Beginn</Label>
                  <DatePicker
                    date={formData.startDate}
                    onDateChange={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                    placeholder="Datum wählen"
                  />
                </div>
                <div>
                  <Label>Ende</Label>
                  <DatePicker
                    date={formData.endDate}
                    onDateChange={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                    placeholder="Datum wählen"
                  />
                </div>
              </div>
              <Button onClick={handleCreateMaternityBenefit} className="w-full" disabled={!selectedEmployee}>
                Leistung berechnen
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={dialogType === 'short-time'} onOpenChange={(open) => !open && setDialogType(null)}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Kurzarbeitergeld
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  60% / 67% des Netto-Entgeltausfalls
                </p>
                <Button 
                  className="w-full" 
                  onClick={() => setDialogType('short-time')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Neue Kurzarbeit
                </Button>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kurzarbeitergeld</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Mitarbeiter</Label>
                <Select onValueChange={(value) => {
                  const employee = employees.find(e => e.id === value);
                  setSelectedEmployee(employee || null);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mitarbeiter auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(employee => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.personalData.firstName} {employee.personalData.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Normale Stunden/Woche</Label>
                  <Input
                    type="number"
                    value={formData.originalHours}
                    onChange={(e) => setFormData(prev => ({ ...prev, originalHours: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label>Reduzierte Stunden/Woche</Label>
                  <Input
                    type="number"
                    value={formData.reducedHours}
                    onChange={(e) => setFormData(prev => ({ ...prev, reducedHours: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.hasChildren}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasChildren: checked }))}
                />
                <Label>Hat Kinder (67% statt 60%)</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Beginn</Label>
                  <DatePicker
                    date={formData.startDate}
                    onDateChange={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                    placeholder="Datum wählen"
                  />
                </div>
                <div>
                  <Label>Ende</Label>
                  <DatePicker
                    date={formData.endDate}
                    onDateChange={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                    placeholder="Datum wählen"
                  />
                </div>
              </div>
              <Button onClick={handleCreateShortTimeWork} className="w-full" disabled={!selectedEmployee}>
                Kurzarbeitergeld berechnen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="sick" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sick">Krankengeld ({sickPayments.length})</TabsTrigger>
          <TabsTrigger value="maternity">Mutterschutz/Elternzeit ({maternityBenefits.length})</TabsTrigger>
          <TabsTrigger value="short-time">Kurzarbeit ({shortTimeWork.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="sick" className="space-y-4">
          {sickPayments.map(payment => {
            const employee = employees.find(e => e.id === payment.employeeId);
            return (
              <Card key={payment.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {employee?.personalData.firstName} {employee?.personalData.lastName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {format(payment.startDate, "PPP", { locale: de })} - {format(payment.endDate, "PPP", { locale: de })}
                      </p>
                    </div>
                    <Badge variant={payment.status === 'active' ? 'default' : 'secondary'}>
                      {payment.status === 'active' ? 'Aktiv' : 'Abgeschlossen'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Krankheitstage</p>
                      <p className="font-medium">{payment.daysOfSickness} Tage</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Krankengeld/Tag</p>
                      <p className="font-medium">{payment.sickPayPerDay.toFixed(2)} €</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Gesamt</p>
                      <p className="font-medium">{payment.totalSickPay.toFixed(2)} €</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="maternity" className="space-y-4">
          {maternityBenefits.map(benefit => {
            const employee = employees.find(e => e.id === benefit.employeeId);
            return (
              <Card key={benefit.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {employee?.personalData.firstName} {employee?.personalData.lastName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {benefit.type === 'maternity-protection' ? 'Mutterschutz' : 'Elternzeit'} | 
                        {format(benefit.startDate, "PPP", { locale: de })} - {format(benefit.endDate, "PPP", { locale: de })}
                      </p>
                    </div>
                    <Badge variant={benefit.status === 'active' ? 'default' : 'secondary'}>
                      {benefit.status === 'active' ? 'Aktiv' : 'Abgeschlossen'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Arbeitgeber</p>
                      <p className="font-medium">{benefit.paidByEmployer.toFixed(2)} €</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Krankenkasse/Staat</p>
                      <p className="font-medium">{benefit.paidByInsurance.toFixed(2)} €</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Gesamt</p>
                      <p className="font-medium">{benefit.totalBenefit.toFixed(2)} €</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="short-time" className="space-y-4">
          {shortTimeWork.map(work => {
            const employee = employees.find(e => e.id === work.employeeId);
            return (
              <Card key={work.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {employee?.personalData.firstName} {employee?.personalData.lastName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {format(work.startDate, "PPP", { locale: de })} - {format(work.endDate, "PPP", { locale: de })}
                      </p>
                    </div>
                    <Badge variant={work.status === 'active' ? 'default' : 'secondary'}>
                      {work.status === 'active' ? 'Aktiv' : 'Abgeschlossen'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Reduzierung</p>
                      <p className="font-medium">{(work.reductionPercentage * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Stunden</p>
                      <p className="font-medium">{work.reducedWorkingHours}h / {work.originalWorkingHours}h</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Gehaltsverlust</p>
                      <p className="font-medium">{work.grossSalaryLoss.toFixed(2)} €</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Kurzarbeitergeld</p>
                      <p className="font-medium">{work.shortTimeWorkBenefit.toFixed(2)} €</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}