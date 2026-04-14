import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Building2, TrendingUp } from "lucide-react";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);

const getStatusBadge = (status: string) => {
  const variants = { 'active': 'default', 'suspended': 'secondary', 'terminated': 'outline' } as const;
  const labels = { 'active': 'Aktiv', 'suspended': 'Pausiert', 'terminated': 'Beendet' };
  return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{labels[status as keyof typeof labels] || status}</Badge>;
};

export function PensionBenefitsTab() {
  const mockOccupationalPensions = [
    {
      id: '1', employeeName: 'Max Mustermann', provider: 'Allianz Lebensversicherung',
      contractNumber: 'AV-2024-001', pensionType: 'Direktversicherung',
      monthlyContribution: 150, employerContribution: 100, employeeContribution: 50, status: 'active'
    }
  ];

  const mockCapitalFormingBenefits = [
    {
      id: '1', employeeName: 'Max Mustermann', provider: 'DWS Vermögensaufbau',
      benefitType: 'Aktienfonds', monthlyAmount: 40, employerContribution: 40,
      employeeContribution: 0, statePremiumEligible: true, statePremiumAmount: 80, status: 'active'
    }
  ];

  return (
    <>
      {/* bAV Tab */}
      <div className="space-y-4" data-tab="pension">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Betriebliche Altersvorsorge (bAV)</CardTitle>
              <Button><Plus className="h-4 w-4 mr-2" />Neue bAV einrichten</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-2">bAV-Förderung 2025</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Steuerfreiheit:</strong> 3.504 € pro Jahr<br /><strong>SV-Freiheit:</strong> 2.928 € pro Jahr</div>
                <div><strong>Gesamtförderung:</strong> 6.432 € pro Jahr<br /><strong>Entgeltumwandlung:</strong> bis 8% der BBG</div>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mitarbeiter</TableHead><TableHead>Anbieter</TableHead><TableHead>Vertragsart</TableHead>
                  <TableHead>Monatlich</TableHead><TableHead>AG-Anteil</TableHead><TableHead>AN-Anteil</TableHead>
                  <TableHead>Status</TableHead><TableHead>Aktionen</TableHead>
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
                        <Button variant="outline" size="sm"><Edit className="h-3 w-3" /></Button>
                        <Button variant="outline" size="sm"><Building2 className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* VL Tab */}
      <div className="space-y-4" data-tab="capital">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Vermögenswirksame Leistungen (VL)</CardTitle>
              <Button><Plus className="h-4 w-4 mr-2" />Neue VL einrichten</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium mb-2">VL-Förderung 2025</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Arbeitgeberbeitrag:</strong> max. 40 € pro Monat<br /><strong>Bausparvertrag:</strong> 43 € Sparzulage</div>
                <div><strong>Aktienfonds:</strong> 80 € Sparzulage<br /><strong>Einkommensgrenze:</strong> 17.900 € / 20.000 €</div>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mitarbeiter</TableHead><TableHead>Anbieter</TableHead><TableHead>Art</TableHead>
                  <TableHead>Monatlich</TableHead><TableHead>AG-Anteil</TableHead><TableHead>Sparzulage</TableHead>
                  <TableHead>Status</TableHead><TableHead>Aktionen</TableHead>
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
                    <TableCell>{benefit.statePremiumEligible ? formatCurrency(benefit.statePremiumAmount) : 'Nicht berechtigt'}</TableCell>
                    <TableCell>{getStatusBadge(benefit.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm"><Edit className="h-3 w-3" /></Button>
                        <Button variant="outline" size="sm"><TrendingUp className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
