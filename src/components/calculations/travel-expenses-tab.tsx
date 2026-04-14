import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Edit, Trash2, CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Employee } from "@/types/employee";

interface TravelExpensesTabProps {
  employees: Employee[];
  selectedEmployee: string;
  onSelectEmployee: (id: string) => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function TravelExpensesTab({ employees, selectedEmployee, onSelectEmployee, selectedDate, onSelectDate }: TravelExpensesTabProps) {
  const mockTravelExpenses = [
    {
      id: '1', employeeName: 'Max Mustermann', date: new Date(2024, 11, 15),
      type: 'Kundenbesuch', description: 'Fahrt zu Kunde ABC GmbH',
      distance: 120, amount: 36.00, status: 'approved'
    },
    {
      id: '2', employeeName: 'Anna Schmidt', date: new Date(2024, 11, 18),
      type: 'Schulung', description: 'Fortbildung in München',
      distance: undefined, amount: 89.50, status: 'pending'
    }
  ];

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);

  const getStatusBadge = (status: string) => {
    const variants = { 'approved': 'default', 'pending': 'secondary', 'rejected': 'destructive' } as const;
    const labels = { 'approved': 'Genehmigt', 'pending': 'Ausstehend', 'rejected': 'Abgelehnt' };
    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{labels[status as keyof typeof labels] || status}</Badge>;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Reisekosten-Abrechnung</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Neue Reisekosten</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Reisekosten erfassen</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Mitarbeiter</Label>
                      <Select value={selectedEmployee} onValueChange={onSelectEmployee}>
                        <SelectTrigger><SelectValue placeholder="Mitarbeiter auswählen" /></SelectTrigger>
                        <SelectContent>
                          {employees.map(e => (
                            <SelectItem key={e.id} value={e.id}>{e.personalData.firstName} {e.personalData.lastName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Datum</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "PPP", { locale: de }) : "Datum wählen"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={selectedDate} onSelect={(d) => d && onSelectDate(d)} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Art der Reise</Label><Select><SelectTrigger><SelectValue placeholder="Art auswählen" /></SelectTrigger><SelectContent><SelectItem value="customer_visit">Kundenbesuch</SelectItem><SelectItem value="training">Schulung</SelectItem><SelectItem value="conference">Konferenz</SelectItem><SelectItem value="business_travel">Dienstreise</SelectItem></SelectContent></Select></div>
                    <div><Label>Kategorie</Label><Select><SelectTrigger><SelectValue placeholder="Kategorie auswählen" /></SelectTrigger><SelectContent><SelectItem value="mileage">Kilometerpauschale</SelectItem><SelectItem value="accommodation">Übernachtung</SelectItem><SelectItem value="meals">Verpflegung</SelectItem><SelectItem value="parking">Parkgebühren</SelectItem><SelectItem value="public_transport">ÖPNV</SelectItem></SelectContent></Select></div>
                  </div>
                  <div><Label>Beschreibung</Label><Input placeholder="z.B. Fahrt zu Kunde ABC GmbH" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Kilometer (falls zutreffend)</Label><Input type="number" placeholder="120" /></div>
                    <div><Label>Betrag</Label><Input type="number" step="0.01" placeholder="36.00" /></div>
                  </div>
                  <div><Label>Zusätzliche Notizen</Label><Textarea placeholder="Optionale Notizen..." /></div>
                  <Button className="w-full">Reisekosten erfassen</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Pauschalsätze 2025</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><strong>Kilometerpauschale:</strong><br />PKW: 0,30 €/km<br />Motorrad: 0,13 €/km</div>
              <div><strong>Verpflegung:</strong><br />Ganztägig: 28 €<br />Teilweise: 14 €</div>
              <div><strong>Übernachtung:</strong><br />Deutschland: 150 €<br />Ausland: 250 €</div>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mitarbeiter</TableHead><TableHead>Datum</TableHead><TableHead>Art</TableHead>
                <TableHead>Beschreibung</TableHead><TableHead>Kilometer</TableHead><TableHead>Betrag</TableHead>
                <TableHead>Status</TableHead><TableHead>Aktionen</TableHead>
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
                      <Button variant="outline" size="sm"><Edit className="h-3 w-3" /></Button>
                      <Button variant="outline" size="sm"><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
