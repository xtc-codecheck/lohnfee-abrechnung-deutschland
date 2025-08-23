import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Building2, FileText, Euro } from "lucide-react";
import { Employee } from "@/types/employee";
import { PayrollPeriod, PayrollEntry } from "@/types/payroll";

interface TaxSocialSecurityReportProps {
  employees: Employee[];
  payrollPeriods: PayrollPeriod[];
  payrollEntries: PayrollEntry[];
  dateRange: { from: Date; to: Date };
  selectedDepartment: string;
}

export function TaxSocialSecurityReport({
  employees,
  payrollPeriods,
  payrollEntries,
  dateRange,
  selectedDepartment
}: TaxSocialSecurityReportProps) {
  
  const reportData = useMemo(() => {
    // Filter entries by date range
    const filteredPeriods = payrollPeriods.filter(period => 
      period.startDate >= dateRange.from && period.endDate <= dateRange.to
    );

    const filteredEntries = payrollEntries.filter(entry => 
      filteredPeriods.some(period => period.id === entry.payrollPeriodId)
    );

    // Calculate tax and social security totals
    const totalIncomeTax = filteredEntries.reduce((sum, entry) => 
      sum + entry.salaryCalculation.taxes.incomeTax, 0);
    const totalChurchTax = filteredEntries.reduce((sum, entry) => 
      sum + entry.salaryCalculation.taxes.churchTax, 0);
    const totalSolidarityTax = filteredEntries.reduce((sum, entry) => 
      sum + entry.salaryCalculation.taxes.solidarityTax, 0);

    const totalHealthInsuranceEmployee = filteredEntries.reduce((sum, entry) => 
      sum + entry.salaryCalculation.socialSecurityContributions.healthInsurance.employee, 0);
    const totalHealthInsuranceEmployer = filteredEntries.reduce((sum, entry) => 
      sum + entry.salaryCalculation.socialSecurityContributions.healthInsurance.employer, 0);
    
    const totalPensionInsuranceEmployee = filteredEntries.reduce((sum, entry) => 
      sum + entry.salaryCalculation.socialSecurityContributions.pensionInsurance.employee, 0);
    const totalPensionInsuranceEmployer = filteredEntries.reduce((sum, entry) => 
      sum + entry.salaryCalculation.socialSecurityContributions.pensionInsurance.employer, 0);

    const totalUnemploymentInsuranceEmployee = filteredEntries.reduce((sum, entry) => 
      sum + entry.salaryCalculation.socialSecurityContributions.unemploymentInsurance.employee, 0);
    const totalUnemploymentInsuranceEmployer = filteredEntries.reduce((sum, entry) => 
      sum + entry.salaryCalculation.socialSecurityContributions.unemploymentInsurance.employer, 0);

    const totalCareInsuranceEmployee = filteredEntries.reduce((sum, entry) => 
      sum + entry.salaryCalculation.socialSecurityContributions.careInsurance.employee, 0);
    const totalCareInsuranceEmployer = filteredEntries.reduce((sum, entry) => 
      sum + entry.salaryCalculation.socialSecurityContributions.careInsurance.employer, 0);

    // Monthly breakdown
    const monthlyBreakdown = filteredPeriods.map(period => {
      const periodEntries = filteredEntries.filter(entry => entry.payrollPeriodId === period.id);
      
      const incomeTax = periodEntries.reduce((sum, entry) => sum + entry.salaryCalculation.taxes.incomeTax, 0);
      const churchTax = periodEntries.reduce((sum, entry) => sum + entry.salaryCalculation.taxes.churchTax, 0);
      const solidarityTax = periodEntries.reduce((sum, entry) => sum + entry.salaryCalculation.taxes.solidarityTax, 0);
      
      const healthInsuranceTotal = periodEntries.reduce((sum, entry) => 
        sum + entry.salaryCalculation.socialSecurityContributions.healthInsurance.total, 0);
      const pensionInsuranceTotal = periodEntries.reduce((sum, entry) => 
        sum + entry.salaryCalculation.socialSecurityContributions.pensionInsurance.total, 0);
      const unemploymentInsuranceTotal = periodEntries.reduce((sum, entry) => 
        sum + entry.salaryCalculation.socialSecurityContributions.unemploymentInsurance.total, 0);
      const careInsuranceTotal = periodEntries.reduce((sum, entry) => 
        sum + entry.salaryCalculation.socialSecurityContributions.careInsurance.total, 0);

      return {
        period,
        taxes: {
          incomeTax,
          churchTax,
          solidarityTax,
          total: incomeTax + churchTax + solidarityTax
        },
        socialSecurity: {
          healthInsurance: healthInsuranceTotal,
          pensionInsurance: pensionInsuranceTotal,
          unemploymentInsurance: unemploymentInsuranceTotal,
          careInsurance: careInsuranceTotal,
          total: healthInsuranceTotal + pensionInsuranceTotal + unemploymentInsuranceTotal + careInsuranceTotal
        }
      };
    });

    // Authority breakdown for DATEV export
    const authorityBreakdown = [
      {
        authority: 'Finanzamt',
        type: 'Steuern',
        amount: totalIncomeTax + totalChurchTax + totalSolidarityTax,
        details: [
          { item: 'Lohnsteuer', amount: totalIncomeTax },
          { item: 'Kirchensteuer', amount: totalChurchTax },
          { item: 'Solidaritätszuschlag', amount: totalSolidarityTax }
        ]
      },
      {
        authority: 'Krankenkassen',
        type: 'Krankenversicherung',
        amount: totalHealthInsuranceEmployee + totalHealthInsuranceEmployer,
        details: [
          { item: 'KV-Beitrag AN', amount: totalHealthInsuranceEmployee },
          { item: 'KV-Beitrag AG', amount: totalHealthInsuranceEmployer }
        ]
      },
      {
        authority: 'Deutsche Rentenversicherung',
        type: 'Rentenversicherung',
        amount: totalPensionInsuranceEmployee + totalPensionInsuranceEmployer,
        details: [
          { item: 'RV-Beitrag AN', amount: totalPensionInsuranceEmployee },
          { item: 'RV-Beitrag AG', amount: totalPensionInsuranceEmployer }
        ]
      },
      {
        authority: 'Bundesagentur für Arbeit',
        type: 'Arbeitslosenversicherung',
        amount: totalUnemploymentInsuranceEmployee + totalUnemploymentInsuranceEmployer,
        details: [
          { item: 'ALV-Beitrag AN', amount: totalUnemploymentInsuranceEmployee },
          { item: 'ALV-Beitrag AG', amount: totalUnemploymentInsuranceEmployer }
        ]
      },
      {
        authority: 'Pflegekassen',
        type: 'Pflegeversicherung',
        amount: totalCareInsuranceEmployee + totalCareInsuranceEmployer,
        details: [
          { item: 'PV-Beitrag AN', amount: totalCareInsuranceEmployee },
          { item: 'PV-Beitrag AG', amount: totalCareInsuranceEmployer }
        ]
      }
    ];

    return {
      totalTaxes: totalIncomeTax + totalChurchTax + totalSolidarityTax,
      totalSocialSecurity: (totalHealthInsuranceEmployee + totalHealthInsuranceEmployer +
                           totalPensionInsuranceEmployee + totalPensionInsuranceEmployer +
                           totalUnemploymentInsuranceEmployee + totalUnemploymentInsuranceEmployer +
                           totalCareInsuranceEmployee + totalCareInsuranceEmployer),
      monthlyBreakdown,
      authorityBreakdown
    };
  }, [employees, payrollPeriods, payrollEntries, dateRange, selectedDepartment]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);

  const formatDate = (date: Date) => new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: 'long'
  }).format(date);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gesamte Steuern</p>
                <p className="text-2xl font-bold">{formatCurrency(reportData.totalTaxes)}</p>
              </div>
              <FileText className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gesamte SV-Beiträge</p>
                <p className="text-2xl font-bold">{formatCurrency(reportData.totalSocialSecurity)}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Monatliche Steuer- und SV-Beiträge</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Monat</TableHead>
                <TableHead>Lohnsteuer</TableHead>
                <TableHead>Kirchensteuer</TableHead>
                <TableHead>Solidaritätszuschlag</TableHead>
                <TableHead>Steuern gesamt</TableHead>
                <TableHead>SV-Beiträge gesamt</TableHead>
                <TableHead>Gesamtsumme</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.monthlyBreakdown.map((month) => (
                <TableRow key={month.period.id}>
                  <TableCell>{formatDate(month.period.startDate)}</TableCell>
                  <TableCell>{formatCurrency(month.taxes.incomeTax)}</TableCell>
                  <TableCell>{formatCurrency(month.taxes.churchTax)}</TableCell>
                  <TableCell>{formatCurrency(month.taxes.solidarityTax)}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(month.taxes.total)}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(month.socialSecurity.total)}</TableCell>
                  <TableCell className="font-bold">{formatCurrency(month.taxes.total + month.socialSecurity.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Authority Breakdown for DATEV */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Abführung nach Behörden (DATEV-Export bereit)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData.authorityBreakdown.map((authority, index) => (
              <Card key={index} className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{authority.authority}</CardTitle>
                    <Badge variant="outline">{authority.type}</Badge>
                  </div>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(authority.amount)}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {authority.details.map((detail, detailIndex) => (
                      <div key={detailIndex} className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{detail.item}</span>
                        <span className="text-sm font-medium">{formatCurrency(detail.amount)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* DATEV Export Information */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center text-green-700">
            <Euro className="h-5 w-5 mr-2" />
            DATEV-Export Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold mb-2">Exportdaten enthalten:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Lohnsteuer nach §38 EStG</li>
                <li>• Kirchensteuer nach LStDV</li>
                <li>• Solidaritätszuschlag nach SolZG</li>
                <li>• SV-Beiträge nach SGB</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">DATEV-Konformität:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• LODAS-Format kompatibel</li>
                <li>• Lohn & Gehalt Interface</li>
                <li>• Automatische Kontierung</li>
                <li>• Prüfziffer-Validierung</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}