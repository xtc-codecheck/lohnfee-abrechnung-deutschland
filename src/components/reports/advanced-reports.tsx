import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  BarChart3, 
  Users, 
  Euro,
  Calendar,
  Shield,
  TrendingUp,
  Building2,
  Clock,
  Heart,
  FileSpreadsheet,
  FileBarChart
} from "lucide-react";
import { useEmployeeStorage } from "@/hooks/use-employee-storage";
import { usePayrollStorage } from "@/hooks/use-payroll-storage";
import { PayrollCostOverviewReport } from "./payroll-cost-overview-report";
import { SickLeaveVacationReport } from "./sick-leave-vacation-report";
import { TaxSocialSecurityReport } from "./tax-social-security-report";
import { AuditReport } from "./audit-report";
import { EmployeeStatisticsReport } from "./employee-statistics-report";
import { ExportManager } from "./export-manager";

interface AdvancedReportsProps {
  onBack: () => void;
}

type ReportType = 'cost-overview' | 'sick-vacation' | 'tax-sv' | 'audit' | 'employee-stats';

export function AdvancedReports({ onBack }: AdvancedReportsProps) {
  const [selectedReport, setSelectedReport] = useState<ReportType>('cost-overview');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1), // Start of year
    to: new Date()
  });
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  
  const { employees } = useEmployeeStorage();
  const { payrollPeriods, payrollEntries } = usePayrollStorage();

  const reportTypes = [
    {
      id: 'cost-overview' as ReportType,
      title: 'Lohnkostenübersicht',
      description: 'Monatliche/jährliche Lohnkosten',
      icon: Euro,
      color: 'text-green-600'
    },
    {
      id: 'sick-vacation' as ReportType,
      title: 'Krankmeldungen & Urlaub',
      description: 'Fehlzeiten-Statistiken',
      icon: Heart,
      color: 'text-red-600'
    },
    {
      id: 'tax-sv' as ReportType,
      title: 'Steuern & SV-Beiträge',
      description: 'Detaillierte Beitragsübersicht',
      icon: Shield,
      color: 'text-blue-600'
    },
    {
      id: 'audit' as ReportType,
      title: 'Audit-Report',
      description: 'Änderungsprotokoll',
      icon: FileText,
      color: 'text-purple-600'
    },
    {
      id: 'employee-stats' as ReportType,
      title: 'Mitarbeiterstatistiken',
      description: 'Fluktuation, Lohnentwicklung',
      icon: Users,
      color: 'text-orange-600'
    }
  ];

  const renderReport = () => {
    const commonProps = {
      employees,
      payrollPeriods,
      payrollEntries,
      dateRange,
      selectedDepartment
    };

    switch (selectedReport) {
      case 'cost-overview':
        return <PayrollCostOverviewReport {...commonProps} />;
      case 'sick-vacation':
        return <SickLeaveVacationReport {...commonProps} />;
      case 'tax-sv':
        return <TaxSocialSecurityReport {...commonProps} />;
      case 'audit':
        return <AuditReport {...commonProps} />;
      case 'employee-stats':
        return <EmployeeStatisticsReport {...commonProps} />;
      default:
        return null;
    }
  };

  const currentReportData = reportTypes.find(r => r.id === selectedReport);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Erweiterte Berichte</h1>
          <p className="text-muted-foreground">Umfassende Analysen und Statistiken</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
      </div>

      {/* Report Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <Card 
              key={report.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedReport === report.id ? 'ring-2 ring-primary shadow-lg' : ''
              }`}
              onClick={() => setSelectedReport(report.id)}
            >
              <CardContent className="p-4 text-center">
                <Icon className={`h-8 w-8 mx-auto mb-2 ${report.color}`} />
                <h3 className="font-semibold text-sm mb-1">{report.title}</h3>
                <p className="text-xs text-muted-foreground">{report.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Filter & Einstellungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="from-date">Von</Label>
              <Input
                id="from-date"
                type="date"
                value={dateRange.from.toISOString().split('T')[0]}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: new Date(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="to-date">Bis</Label>
              <Input
                id="to-date"
                type="date"
                value={dateRange.to.toISOString().split('T')[0]}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: new Date(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="department">Abteilung</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Abteilung wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Abteilungen</SelectItem>
                  <SelectItem value="hr">Personal</SelectItem>
                  <SelectItem value="it">IT</SelectItem>
                  <SelectItem value="sales">Vertrieb</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <ExportManager 
                reportType={selectedReport}
                reportData={currentReportData}
                filters={{ dateRange, selectedDepartment }}
                employees={employees}
                payrollPeriods={payrollPeriods}
                payrollEntries={payrollEntries}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {currentReportData && (
              <>
                <currentReportData.icon className={`h-5 w-5 mr-2 ${currentReportData.color}`} />
                {currentReportData.title}
              </>
            )}
          </CardTitle>
          <CardDescription>
            {currentReportData?.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderReport()}
        </CardContent>
      </Card>
    </div>
  );
}