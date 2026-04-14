import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface Execution {
  id: string;
  jobName: string;
  startedAt: Date;
  completedAt: Date | null;
  status: string;
  processedEmployees: number;
  totalEmployees: number;
  emailsSent: number;
}

interface AutomationHistoryTabProps {
  executions: Execution[];
  getStatusBadge: (status: string) => React.ReactNode;
}

export function AutomationHistoryTab({ executions, getStatusBadge }: AutomationHistoryTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Ausführungs-Verlauf</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Gestartet</TableHead>
                <TableHead>Abgeschlossen</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mitarbeiter</TableHead>
                <TableHead>E-Mails</TableHead>
                <TableHead>Dauer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {executions.map(exec => (
                <TableRow key={exec.id}>
                  <TableCell className="font-medium">{exec.jobName}</TableCell>
                  <TableCell>
                    {format(exec.startedAt, 'dd.MM.yyyy HH:mm', { locale: de })}
                  </TableCell>
                  <TableCell>
                    {exec.completedAt && format(exec.completedAt, 'dd.MM.yyyy HH:mm', { locale: de })}
                  </TableCell>
                  <TableCell>{getStatusBadge(exec.status)}</TableCell>
                  <TableCell>
                    {exec.processedEmployees}/{exec.totalEmployees}
                  </TableCell>
                  <TableCell>{exec.emailsSent}</TableCell>
                  <TableCell>
                    {exec.completedAt &&
                      `${Math.round((exec.completedAt.getTime() - exec.startedAt.getTime()) / 60000)} min`
                    }
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
