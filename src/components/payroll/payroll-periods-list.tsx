import { Calendar, Eye, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PayrollPeriod, PayrollReport } from "@/types/payroll";
import { getPayrollStatusColor, getPayrollStatusLabel } from "@/lib/formatters";

interface PayrollPeriodsListProps {
  sortedPeriods: PayrollPeriod[];
  getPayrollReport: (periodId: string) => PayrollReport | null;
  onViewDetail: (periodId: string) => void;
  onDeletePeriod: (periodId: string) => void;
  onCreatePayroll: () => void;
}

export function PayrollPeriodsList({
  sortedPeriods,
  getPayrollReport,
  onViewDetail,
  onDeletePeriod,
  onCreatePayroll,
}: PayrollPeriodsListProps) {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Abrechnungsperioden</CardTitle>
        <CardDescription>Übersicht aller Lohnabrechnungen</CardDescription>
      </CardHeader>
      <CardContent>
        {sortedPeriods.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Noch keine Abrechnungen</h3>
            <p className="text-muted-foreground mb-4">Erstellen Sie die erste monatliche Lohnabrechnung.</p>
            <Button onClick={onCreatePayroll} className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Erste Abrechnung erstellen
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedPeriods.map((period) => {
              const report = getPayrollReport(period.id);
              return (
                <div
                  key={period.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-gradient-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground font-medium">
                        {period.month.toString().padStart(2, '0')}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">
                        {new Date(period.year, period.month - 1).toLocaleDateString('de-DE', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getPayrollStatusColor(period.status)}>
                          {getPayrollStatusLabel(period.status)}
                        </Badge>
                        {report && (
                          <span className="text-sm text-muted-foreground">
                            {report.entries.length} Mitarbeiter •{' '}
                            {report.summary.totalNetSalary.toLocaleString('de-DE', {
                              style: 'currency',
                              currency: 'EUR',
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetail(period.id)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      Details
                    </Button>
                    {period.status === 'draft' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex items-center gap-1 text-destructive hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Abrechnung löschen?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Möchten Sie die Abrechnung für{' '}
                              {new Date(period.year, period.month - 1).toLocaleDateString('de-DE', {
                                month: 'long',
                                year: 'numeric',
                              })}{' '}
                              wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDeletePeriod(period.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Löschen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
