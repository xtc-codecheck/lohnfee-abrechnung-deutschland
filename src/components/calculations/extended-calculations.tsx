import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  ChevronLeft, 
  Plus, 
  Car, 
  Plane, 
  Receipt, 
  CalendarIcon, 
  Edit,
  Trash2,
  PiggyBank,
  TrendingUp,
  Building2
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useEmployeeStorage } from "@/hooks/use-employee-storage";

interface ExtendedCalculationsProps {
  onBack: () => void;
}

export function ExtendedCalculations({ onBack }: ExtendedCalculationsProps) {
  const { employees } = useEmployeeStorage();
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Mock-Daten für Reisekosten
  const mockTravelExpenses = [
    {
      id: '1',
      employeeId: '1',
      employeeName: 'Max Mustermann',
      date: new Date(2024, 11, 15),
      type: 'Kundenbesuch',
      description: 'Fahrt zu Kunde ABC GmbH',
      distance: 120,
      amount: 36.00,
      status: 'approved'
    },
    {
      id: '2',
      employeeId: '2',
      employeeName: 'Anna Schmidt',
      date: new Date(2024, 11, 18),
      type: 'Schulung',
      description: 'Fortbildung in München',
      amount: 89.50,
      status: 'pending'
    }
  ];

  // Mock-Daten für bAV
  const mockOccupationalPensions = [
    {
      id: '1',
      employeeId: '1',
      employeeName: 'Max Mustermann',
      provider: 'Allianz Lebensversicherung',
      contractNumber: 'AV-2024-001',
      pensionType: 'Direktversicherung',
      monthlyContribution: 150,
      employerContribution: 100,
      employeeContribution: 50,
      status: 'active'
    }
  ];

  // Mock-Daten für VL
  const mockCapitalFormingBenefits = [
    {
      id: '1',
      employeeId: '1',
      employeeName: 'Max Mustermann',
      provider: 'DWS Vermögensaufbau',
      benefitType: 'Aktienfonds',
      monthlyAmount: 40,
      employerContribution: 40,
      employeeContribution: 0,
      statePremiumEligible: true,
      statePremiumAmount: 80,
      status: 'active'
    }
  ];

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);

  const getStatusBadge = (status: string) => {
    const variants = {
      'approved': 'default',
      'pending': 'secondary',
      'rejected': 'destructive',
      'active': 'default',
      'suspended': 'secondary',
      'terminated': 'outline'
    } as const;
    
    const labels = {
      'approved': 'Genehmigt',
      'pending': 'Ausstehend',
      'rejected': 'Abgelehnt',
      'active': 'Aktiv',
      'suspended': 'Pausiert',
      'terminated': 'Beendet'
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
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
        <h1 className="text-3xl font-bold">Erweiterte Berechnungen</h1>
      </div>

      {/* Übersichts-Karten */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Car className="h-4 w-4" />
              Reisekosten Dezember
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€1.245</div>
            <p className="text-xs text-muted-foreground">8 Abrechnungen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PiggyBank className="h-4 w-4" />
              bAV-Beiträge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€2.400</div>
            <p className="text-xs text-muted-foreground">Monatlich gesamt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              VL-Leistungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€600</div>
            <p className="text-xs text-muted-foreground">Monatlich gesamt</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="travel" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="travel">Reisekosten</TabsTrigger>
          <TabsTrigger value="pension">bAV</TabsTrigger>
          <TabsTrigger value="capital">VL</TabsTrigger>
        </TabsList>

        <TabsContent value="travel" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Reisekosten-Abrechnung</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Neue Reisekosten
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Reisekosten erfassen</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Mitarbeiter</Label>
                          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
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
                          <Label>Datum</Label>
                          <DatePicker
                            date={selectedDate}
                            onDateChange={setSelectedDate}
                            placeholder="Datum wählen"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Art der Reise</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Art auswählen" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="customer_visit">Kundenbesuch</SelectItem>
                              <SelectItem value="training">Schulung</SelectItem>
                              <SelectItem value="conference">Konferenz</SelectItem>
                              <SelectItem value="business_travel">Dienstreise</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Kategorie</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Kategorie auswählen" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mileage">Kilometerpauschale</SelectItem>
                              <SelectItem value="accommodation">Übernachtung</SelectItem>
                              <SelectItem value="meals">Verpflegung</SelectItem>
                              <SelectItem value="parking">Parkgebühren</SelectItem>
                              <SelectItem value="public_transport">ÖPNV</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label>Beschreibung</Label>
                        <Input placeholder="z.B. Fahrt zu Kunde ABC GmbH" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Kilometer (falls zutreffend)</Label>
                          <Input type="number" placeholder="120" />
                        </div>
                        <div>
                          <Label>Betrag</Label>
                          <Input type="number" step="0.01" placeholder="36.00" />
                        </div>
                      </div>

                      <div>
                        <Label>Zusätzliche Notizen</Label>
                        <Textarea placeholder="Optionale Notizen..." />
                      </div>

                      <Button className="w-full">
                        Reisekosten erfassen
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Pauschalsätze 2025</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <strong>Kilometerpauschale:</strong>
                    <br />PKW: 0,30 €/km
                    <br />Motorrad: 0,13 €/km
                  </div>
                  <div>
                    <strong>Verpflegung:</strong>
                    <br />Ganztägig: 28 €
                    <br />Teilweise: 14 €
                  </div>
                  <div>
                    <strong>Übernachtung:</strong>
                    <br />Deutschland: 150 €
                    <br />Ausland: 250 €
                  </div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mitarbeiter</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Art</TableHead>
                    <TableHead>Beschreibung</TableHead>
                    <TableHead>Kilometer</TableHead>
                    <TableHead>Betrag</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTravelExpenses.map(expense => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.employeeName}</TableCell>
                      <TableCell>{format(expense.date, 'dd.MM.yyyy', { locale: de })}</TableCell>
                      <TableCell>{expense.type}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{expense.distance ? `${expense.distance} km` : '-'}</TableCell>
                      <TableCell>{formatCurrency(expense.amount)}</TableCell>
                      <TableCell>{getStatusBadge(expense.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pension" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Betriebliche Altersvorsorge (bAV)</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Neue bAV einrichten
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2">bAV-Förderung 2025</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Steuerfreiheit:</strong> 3.504 € pro Jahr<br />
                    <strong>SV-Freiheit:</strong> 2.928 € pro Jahr
                  </div>
                  <div>
                    <strong>Gesamtförderung:</strong> 6.432 € pro Jahr<br />
                    <strong>Entgeltumwandlung:</strong> bis 8% der BBG
                  </div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mitarbeiter</TableHead>
                    <TableHead>Anbieter</TableHead>
                    <TableHead>Vertragsart</TableHead>
                    <TableHead>Monatlich</TableHead>
                    <TableHead>AG-Anteil</TableHead>
                    <TableHead>AN-Anteil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockOccupationalPensions.map(pension => (
                    <TableRow key={pension.id}>
                      <TableCell className="font-medium">{pension.employeeName}</TableCell>
                      <TableCell>{pension.provider}</TableCell>
                      <TableCell>{pension.pensionType}</TableCell>
                      <TableCell>{formatCurrency(pension.monthlyContribution)}</TableCell>
                      <TableCell>{formatCurrency(pension.employerContribution)}</TableCell>
                      <TableCell>{formatCurrency(pension.employeeContribution)}</TableCell>
                      <TableCell>{getStatusBadge(pension.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Building2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capital" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Vermögenswirksame Leistungen (VL)</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Neue VL einrichten
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium mb-2">VL-Förderung 2025</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Arbeitgeberbeitrag:</strong> max. 40 € pro Monat<br />
                    <strong>Bausparvertrag:</strong> 43 € Sparzulage
                  </div>
                  <div>
                    <strong>Aktienfonds:</strong> 80 € Sparzulage<br />
                    <strong>Einkommensgrenze:</strong> 17.900 € / 20.000 €
                  </div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mitarbeiter</TableHead>
                    <TableHead>Anbieter</TableHead>
                    <TableHead>Art</TableHead>
                    <TableHead>Monatlich</TableHead>
                    <TableHead>AG-Anteil</TableHead>
                    <TableHead>Sparzulage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCapitalFormingBenefits.map(benefit => (
                    <TableRow key={benefit.id}>
                      <TableCell className="font-medium">{benefit.employeeName}</TableCell>
                      <TableCell>{benefit.provider}</TableCell>
                      <TableCell>{benefit.benefitType}</TableCell>
                      <TableCell>{formatCurrency(benefit.monthlyAmount)}</TableCell>
                      <TableCell>{formatCurrency(benefit.employerContribution)}</TableCell>
                      <TableCell>
                        {benefit.statePremiumEligible ? 
                          formatCurrency(benefit.statePremiumAmount) : 
                          'Nicht berechtigt'
                        }
                      </TableCell>
                      <TableCell>{getStatusBadge(benefit.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <TrendingUp className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}