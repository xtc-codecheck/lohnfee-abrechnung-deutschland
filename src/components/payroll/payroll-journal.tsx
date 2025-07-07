import { useState, useMemo } from "react";
import { ArrowLeft, Calendar, Download, Filter, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { usePayrollStorage } from "@/hooks/use-payroll-storage";
import { useEmployeeStorage } from "@/hooks/use-employee-storage";
import { PayrollEntry } from "@/types/payroll";

interface PayrollJournalProps {
  onBack: () => void;
  onViewAccount: (employeeId: string) => void;
}

export function PayrollJournal({ onBack, onViewAccount }: PayrollJournalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  
  const { payrollPeriods, payrollEntries } = usePayrollStorage();
  const { employees } = useEmployeeStorage();

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    let filtered = payrollEntries;

    // Filter by search term (employee name)
    if (searchTerm) {
      filtered = filtered.filter(entry => {
        const fullName = `${entry.employee.personalData.firstName} ${entry.employee.personalData.lastName}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
      });
    }

    // Filter by period
    if (selectedPeriod !== "all") {
      filtered = filtered.filter(entry => entry.payrollPeriodId === selectedPeriod);
    }

    // Filter by employee
    if (selectedEmployee !== "all") {
      filtered = filtered.filter(entry => entry.employeeId === selectedEmployee);
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [payrollEntries, searchTerm, selectedPeriod, selectedEmployee]);

  const totalGross = filteredEntries.reduce((sum, entry) => sum + entry.salaryCalculation.grossSalary, 0);
  const totalNet = filteredEntries.reduce((sum, entry) => sum + entry.finalNetSalary, 0);
  const totalTax = filteredEntries.reduce((sum, entry) => sum + entry.salaryCalculation.taxes.total, 0);

  const getPeriodName = (periodId: string) => {
    const period = payrollPeriods.find(p => p.id === periodId);
    if (!period) return "Unbekannt";
    
    const monthNames = [
      "Januar", "Februar", "März", "April", "Mai", "Juni",
      "Juli", "August", "September", "Oktober", "November", "Dezember"
    ];
    
    return `${monthNames[period.month - 1]} ${period.year}`;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'draft': 'secondary',
      'calculated': 'default',
      'approved': 'default',
      'paid': 'default',
      'finalized': 'default'
    } as const;
    
    const labels = {
      'draft': 'Entwurf',
      'calculated': 'Berechnet',
      'approved': 'Genehmigt',
      'paid': 'Bezahlt',
      'finalized': 'Abgeschlossen'
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Lohnjournal"
        description="Chronologische Übersicht aller Lohnabrechnungen"
      >
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Bruttolohn gesamt</p>
              <p className="text-2xl font-bold text-primary">
                {totalGross.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Nettolohn gesamt</p>
              <p className="text-2xl font-bold text-success">
                {totalNet.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Steuern gesamt</p>
              <p className="text-2xl font-bold text-destructive">
                {totalTax.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mitarbeiter suchen</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Name eingeben..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Abrechnungsperiode</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Periode wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Perioden</SelectItem>
                  {payrollPeriods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {getPeriodName(period.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mitarbeiter</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Mitarbeiter wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Mitarbeiter</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.personalData.firstName} {employee.personalData.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journal Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Lohnjournal</CardTitle>
          <CardDescription>
            {filteredEntries.length} Einträge gefunden
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEntries.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Mitarbeiter</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Brutto</TableHead>
                    <TableHead className="text-right">Netto</TableHead>
                    <TableHead className="text-right">Steuern</TableHead>
                    <TableHead className="text-center">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {entry.createdAt.toLocaleDateString('de-DE')}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {entry.employee.personalData.firstName} {entry.employee.personalData.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {entry.employee.personalData.taxClass}
                        </div>
                      </TableCell>
                      <TableCell>{getPeriodName(entry.payrollPeriodId)}</TableCell>
                      <TableCell>
                        {getStatusBadge(
                          payrollPeriods.find(p => p.id === entry.payrollPeriodId)?.status || 'draft'
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {entry.salaryCalculation.grossSalary.toLocaleString('de-DE', { 
                          style: 'currency', 
                          currency: 'EUR' 
                        })}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {entry.finalNetSalary.toLocaleString('de-DE', { 
                          style: 'currency', 
                          currency: 'EUR' 
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.salaryCalculation.taxes.total.toLocaleString('de-DE', { 
                          style: 'currency', 
                          currency: 'EUR' 
                        })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewAccount(entry.employeeId)}
                          className="flex items-center gap-1"
                        >
                          <User className="h-4 w-4" />
                          Konto
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Keine Einträge gefunden</h3>
              <p className="text-sm text-muted-foreground">
                Keine Lohnabrechnungen entsprechen den gewählten Filterkriterien.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}