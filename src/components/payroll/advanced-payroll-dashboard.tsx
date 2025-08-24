import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ChevronLeft, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Euro, 
  FileBarChart,
  AlertTriangle,
  CheckCircle,
  Download,
  Calendar
} from "lucide-react";
import { useEmployeeStorage } from "@/hooks/use-employee-storage";
import { usePayrollStorage } from "@/hooks/use-payroll-storage";
import { useTimeTracking } from "@/hooks/use-time-tracking";
import { 
  createPayrollTimeSeries,
  calculatePayrollCostBreakdown,
  createSocialSecurityOverview,
  createTaxOverview,
  type PayrollCostBreakdown,
  type SocialSecurityOverview,
  type TaxOverview,
  type PayrollTimeSeriesData
} from "@/utils/advanced-payroll-reports";
import { 
  createPayrollFromTimeTracking,
  type PayrollTimeIntegration
} from "@/utils/time-payroll-integration";
import { validatePayrollCompliance } from "@/utils/payroll-compliance";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface AdvancedPayrollDashboardProps {
  onBack: () => void;
}

export function AdvancedPayrollDashboard({ onBack }: AdvancedPayrollDashboardProps) {
  const { employees } = useEmployeeStorage();
  const { payrollPeriods, payrollEntries } = usePayrollStorage();
  const { timeEntries } = useTimeTracking();
  
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [timeSeriesData, setTimeSeriesData] = useState<PayrollTimeSeriesData | null>(null);
  const [payrollBreakdowns, setPayrollBreakdowns] = useState<PayrollCostBreakdown[]>([]);
  const [timeIntegrations, setTimeIntegrations] = useState<PayrollTimeIntegration[]>([]);

  // Lade Daten wenn sich Parameter ändern
  useEffect(() => {
    if (selectedPeriod) {
      const period = payrollPeriods.find(p => p.id === selectedPeriod);
      if (period) {
        // Berechne Payroll-Breakdowns
        const breakdowns = calculatePayrollCostBreakdown(employees, payrollEntries, selectedPeriod);
        
        // Filtere nach Abteilung
        const filteredBreakdowns = selectedDepartment === "all" 
          ? breakdowns 
          : breakdowns.filter(b => b.department === selectedDepartment);
        
        setPayrollBreakdowns(filteredBreakdowns);
        
        // Erstelle Zeitreihen-Daten
        const timeSeries = createPayrollTimeSeries(
          employees, 
          payrollEntries, 
          payrollPeriods, 
          new Date(period.year, period.month - 1, 1)
        );
        setTimeSeriesData(timeSeries);
        
        // Zeiterfassungs-Integration
        const integrations = createPayrollFromTimeTracking(
          employees, 
          timeEntries, 
          period.year, 
          period.month
        );
        setTimeIntegrations(integrations);
      }
    }
  }, [selectedPeriod, selectedDepartment, employees, payrollEntries, payrollPeriods, timeEntries]);

  // Verfügbare Abteilungen
  const departments = [...new Set(employees.map(e => e.employmentData.department))];

  // Compliance-Statistiken
  const complianceStats = timeIntegrations.map(integration => {
    const employee = employees.find(e => e.id === integration.employeeId);
    if (!employee) return null;
    
    const compliance = validatePayrollCompliance(employee, integration.timeData);
    return {
      employeeId: integration.employeeId,
      employeeName: integration.employeeName,
      isCompliant: compliance.overallCompliance,
      violations: compliance.violations
    };
  }).filter(Boolean);

  const complianceRate = complianceStats.length > 0 
    ? (complianceStats.filter(s => s?.isCompliant).length / complianceStats.length) * 100 
    : 0;

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const ComparisonCard = ({ 
    title, 
    current, 
    previous, 
    format = formatCurrency 
  }: { 
    title: string; 
    current: number; 
    previous: number; 
    format?: (value: number) => string; 
  }) => {
    const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    const isPositive = change > 0;
    
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{format(current)}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            {isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span className={isPositive ? "text-green-500" : "text-red-500"}>
              {formatPercentage(Math.abs(change))}
            </span>
            <span className="ml-1">vs. Vorjahr</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        <h1 className="text-3xl font-bold">Erweiterte Lohn-Reports</h1>
      </div>

      {/* Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Lohnperiode</label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger>
              <SelectValue placeholder="Periode auswählen" />
            </SelectTrigger>
            <SelectContent>
              {payrollPeriods.map(period => (
                <SelectItem key={period.id} value={period.id}>
                  {format(new Date(period.year, period.month - 1), 'MMMM yyyy', { locale: de })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium">Abteilung</label>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger>
              <SelectValue placeholder="Abteilung auswählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Abteilungen</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-end">
          <Button className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {selectedPeriod && timeSeriesData && (
        <>
          {/* Übersichts-Karten */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ComparisonCard
              title="Bruttolöhne gesamt"
              current={timeSeriesData.month.totalGrossSalary}
              previous={timeSeriesData.previousYear.totalGrossSalary}
            />
            <ComparisonCard
              title="Arbeitgeberkosten"
              current={timeSeriesData.month.totalGrossSalary + timeSeriesData.month.totalEmployerContributions}
              previous={timeSeriesData.previousYear.totalGrossSalary + timeSeriesData.previousYear.totalEmployerContributions}
            />
            <ComparisonCard
              title="Steuerbelastung"
              current={timeSeriesData.month.totalTaxBurden}
              previous={timeSeriesData.previousYear.totalTaxBurden}
            />
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Compliance-Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(complianceRate)}</div>
                <Progress value={complianceRate} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="costs" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="costs">Lohnkosten</TabsTrigger>
              <TabsTrigger value="social">Sozialversicherung</TabsTrigger>
              <TabsTrigger value="taxes">Steuern</TabsTrigger>
              <TabsTrigger value="time">Zeiterfassung</TabsTrigger>
            </TabsList>

            <TabsContent value="costs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Euro className="h-5 w-5" />
                    Vollständige Lohnkosten-Aufschlüsselung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mitarbeiter</TableHead>
                        <TableHead>Abteilung</TableHead>
                        <TableHead>Brutto</TableHead>
                        <TableHead>AN-Beiträge</TableHead>
                        <TableHead>AG-Beiträge</TableHead>
                        <TableHead>Steuern</TableHead>
                        <TableHead>Netto</TableHead>
                        <TableHead>AG-Kosten</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payrollBreakdowns.map(breakdown => (
                        <TableRow key={breakdown.employeeId}>
                          <TableCell className="font-medium">{breakdown.employeeName}</TableCell>
                          <TableCell>{breakdown.department}</TableCell>
                          <TableCell>{formatCurrency(breakdown.grossSalary)}</TableCell>
                          <TableCell>{formatCurrency(breakdown.employeeTotalSocialSecurity)}</TableCell>
                          <TableCell>{formatCurrency(breakdown.employerTotalSocialSecurity)}</TableCell>
                          <TableCell>{formatCurrency(breakdown.totalTaxes)}</TableCell>
                          <TableCell>{formatCurrency(breakdown.netSalary)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(breakdown.totalEmployerCosts)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monat */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Aktueller Monat</CardTitle>
                    <p className="text-sm text-muted-foreground">{timeSeriesData.month.period}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <span>Versicherung</span>
                      <span>AN-Anteil</span>
                      <span>AG-Anteil</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-medium">Rente</span>
                      <span>{formatCurrency(timeSeriesData.month.pensionEmployeeTotal)}</span>
                      <span>{formatCurrency(timeSeriesData.month.pensionEmployerTotal)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-medium">ALV</span>
                      <span>{formatCurrency(timeSeriesData.month.unemploymentEmployeeTotal)}</span>
                      <span>{formatCurrency(timeSeriesData.month.unemploymentEmployerTotal)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-medium">Kranken</span>
                      <span>{formatCurrency(timeSeriesData.month.healthEmployeeTotal)}</span>
                      <span>{formatCurrency(timeSeriesData.month.healthEmployerTotal)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-medium">Pflege</span>
                      <span>{formatCurrency(timeSeriesData.month.careEmployeeTotal)}</span>
                      <span>{formatCurrency(timeSeriesData.month.careEmployerTotal)}</span>
                    </div>
                    <div className="border-t pt-2 grid grid-cols-3 gap-2 font-bold">
                      <span>Gesamt</span>
                      <span>{formatCurrency(timeSeriesData.month.totalEmployeeContributions)}</span>
                      <span>{formatCurrency(timeSeriesData.month.totalEmployerContributions)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* YTD */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Jahr bis heute</CardTitle>
                    <p className="text-sm text-muted-foreground">{timeSeriesData.yearToDate.period}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <span>Versicherung</span>
                      <span>AN-Anteil</span>
                      <span>AG-Anteil</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-medium">Rente</span>
                      <span>{formatCurrency(timeSeriesData.yearToDate.pensionEmployeeTotal)}</span>
                      <span>{formatCurrency(timeSeriesData.yearToDate.pensionEmployerTotal)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-medium">ALV</span>
                      <span>{formatCurrency(timeSeriesData.yearToDate.unemploymentEmployeeTotal)}</span>
                      <span>{formatCurrency(timeSeriesData.yearToDate.unemploymentEmployerTotal)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-medium">Kranken</span>
                      <span>{formatCurrency(timeSeriesData.yearToDate.healthEmployeeTotal)}</span>
                      <span>{formatCurrency(timeSeriesData.yearToDate.healthEmployerTotal)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-medium">Pflege</span>
                      <span>{formatCurrency(timeSeriesData.yearToDate.careEmployeeTotal)}</span>
                      <span>{formatCurrency(timeSeriesData.yearToDate.careEmployerTotal)}</span>
                    </div>
                    <div className="border-t pt-2 grid grid-cols-3 gap-2 font-bold">
                      <span>Gesamt</span>
                      <span>{formatCurrency(timeSeriesData.yearToDate.totalEmployeeContributions)}</span>
                      <span>{formatCurrency(timeSeriesData.yearToDate.totalEmployerContributions)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Vorjahr */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Vorjahr</CardTitle>
                    <p className="text-sm text-muted-foreground">{timeSeriesData.previousYear.period}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <span>Versicherung</span>
                      <span>AN-Anteil</span>
                      <span>AG-Anteil</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-medium">Rente</span>
                      <span>{formatCurrency(timeSeriesData.previousYear.pensionEmployeeTotal)}</span>
                      <span>{formatCurrency(timeSeriesData.previousYear.pensionEmployerTotal)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-medium">ALV</span>
                      <span>{formatCurrency(timeSeriesData.previousYear.unemploymentEmployeeTotal)}</span>
                      <span>{formatCurrency(timeSeriesData.previousYear.unemploymentEmployerTotal)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-medium">Kranken</span>
                      <span>{formatCurrency(timeSeriesData.previousYear.healthEmployeeTotal)}</span>
                      <span>{formatCurrency(timeSeriesData.previousYear.healthEmployerTotal)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-medium">Pflege</span>
                      <span>{formatCurrency(timeSeriesData.previousYear.careEmployeeTotal)}</span>
                      <span>{formatCurrency(timeSeriesData.previousYear.careEmployerTotal)}</span>
                    </div>
                    <div className="border-t pt-2 grid grid-cols-3 gap-2 font-bold">
                      <span>Gesamt</span>
                      <span>{formatCurrency(timeSeriesData.previousYear.totalEmployeeContributions)}</span>
                      <span>{formatCurrency(timeSeriesData.previousYear.totalEmployerContributions)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="taxes" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[
                  { title: "Aktueller Monat", data: timeSeriesData.month },
                  { title: "Jahr bis heute", data: timeSeriesData.yearToDate },
                  { title: "Vorjahr", data: timeSeriesData.previousYear }
                ].map(({ title, data }) => (
                  <Card key={title}>
                    <CardHeader>
                      <CardTitle className="text-lg">{title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{data.period}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium">Lohnsteuer</span>
                        <span>{formatCurrency(data.totalIncomeTax)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium">Solidaritätszuschlag</span>
                        <span>{formatCurrency(data.totalSolidarityTax)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium">Kirchensteuer</span>
                        <span>{formatCurrency(data.totalChurchTax)}</span>
                      </div>
                      <div className="border-t pt-2 grid grid-cols-2 gap-2 font-bold">
                        <span>Gesamt</span>
                        <span>{formatCurrency(data.totalTaxBurden)}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Durchschnittlicher Steuersatz: {formatPercentage(data.averageTaxRate)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="time" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Zeiterfassungs-Integration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mitarbeiter</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Regelstunden</TableHead>
                        <TableHead>Überstunden</TableHead>
                        <TableHead>Arbeitstage</TableHead>
                        <TableHead>Diskrepanzen</TableHead>
                        <TableHead>Compliance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timeIntegrations.map(integration => {
                        const employee = employees.find(e => e.id === integration.employeeId);
                        const compliance = employee ? validatePayrollCompliance(employee, integration.timeData) : null;
                        
                        return (
                          <TableRow key={integration.employeeId}>
                            <TableCell className="font-medium">{integration.employeeName}</TableCell>
                            <TableCell>
                              <Badge variant={
                                integration.status === 'complete' ? 'default' :
                                integration.status === 'discrepancies' ? 'destructive' : 'secondary'
                              }>
                                {integration.status === 'complete' ? 'Vollständig' :
                                 integration.status === 'discrepancies' ? 'Diskrepanzen' : 'Unvollständig'}
                              </Badge>
                            </TableCell>
                            <TableCell>{integration.timeData.regularHours}h</TableCell>
                            <TableCell>{integration.timeData.overtimeHours}h</TableCell>
                            <TableCell>
                              {integration.timeData.actualWorkingDays}/{integration.timeData.expectedWorkingDays}
                            </TableCell>
                            <TableCell>
                              {integration.discrepancies.length > 0 ? (
                                <Badge variant="outline">
                                  {integration.discrepancies.length}
                                </Badge>
                              ) : (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                            </TableCell>
                            <TableCell>
                              {compliance?.overallCompliance ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Compliance-Warnungen */}
              {complianceStats.some(s => !s?.isCompliant) && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Compliance-Verletzungen erkannt:</strong>
                    <ul className="mt-2 space-y-1">
                      {complianceStats
                        .filter(s => !s?.isCompliant)
                        .map(s => (
                          <li key={s?.employeeId} className="text-sm">
                            <strong>{s?.employeeName}:</strong> {s?.violations.join(', ')}
                          </li>
                        ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}