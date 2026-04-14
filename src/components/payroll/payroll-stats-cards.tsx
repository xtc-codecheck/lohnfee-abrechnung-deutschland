import { Calendar, DollarSign, FileText, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PayrollPeriod } from "@/types/payroll";

interface PayrollStatsCardsProps {
  payrollPeriods: PayrollPeriod[];
  totalEmployees: number;
}

export function PayrollStatsCards({ payrollPeriods, totalEmployees }: PayrollStatsCardsProps) {
  const totalPeriods = payrollPeriods.length;
  const activePeriods = payrollPeriods.filter(p => p.status !== 'finalized').length;
  const lastProcessed = payrollPeriods
    .filter(p => p.processedAt)
    .sort((a, b) => (b.processedAt!.getTime() - a.processedAt!.getTime()))[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="shadow-card hover:shadow-elegant transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Abrechnungsperioden</CardTitle>
          <Calendar className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{totalPeriods}</div>
          <p className="text-xs text-muted-foreground">{activePeriods} aktiv</p>
        </CardContent>
      </Card>

      <Card className="shadow-card hover:shadow-elegant transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Mitarbeiter</CardTitle>
          <Users className="h-4 w-4 text-secondary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-secondary">{totalEmployees}</div>
          <p className="text-xs text-muted-foreground">Zu berücksichtigen</p>
        </CardContent>
      </Card>

      <Card className="shadow-card hover:shadow-elegant transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Letzte Abrechnung</CardTitle>
          <FileText className="h-4 w-4 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold text-accent">
            {lastProcessed
              ? `${lastProcessed.month.toString().padStart(2, '0')}/${lastProcessed.year}`
              : 'Keine'}
          </div>
          <p className="text-xs text-muted-foreground">
            {lastProcessed?.processedAt
              ? lastProcessed.processedAt.toLocaleDateString('de-DE')
              : 'Noch keine Abrechnung'}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-card hover:shadow-elegant transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status</CardTitle>
          <DollarSign className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold text-warning">
            {activePeriods > 0 ? 'Aktiv' : 'Bereit'}
          </div>
          <p className="text-xs text-muted-foreground">System bereit für neue Abrechnungen</p>
        </CardContent>
      </Card>
    </div>
  );
}
