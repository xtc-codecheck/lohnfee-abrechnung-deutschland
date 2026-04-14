import { CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PayrollAnomaly } from '@/types/payroll-guardian';
import { getSeverityBadge, getAnomalyIcon } from './guardian-helpers';

interface GuardianAnomaliesTabProps {
  unresolvedAnomalies: PayrollAnomaly[];
  resolveAnomaly: (id: string, resolution: string) => void;
  dismissAnomaly: (id: string) => void;
}

export function GuardianAnomaliesTab({ unresolvedAnomalies, resolveAnomaly, dismissAnomaly }: GuardianAnomaliesTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Alle Anomalien</CardTitle>
          <CardDescription>
            Erkannte Unregelmäßigkeiten in der Lohnabrechnung
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Typ</TableHead>
                <TableHead>Mitarbeiter</TableHead>
                <TableHead>Beschreibung</TableHead>
                <TableHead>Schwere</TableHead>
                <TableHead>Erkannt</TableHead>
                <TableHead>Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unresolvedAnomalies.map(anomaly => (
                <TableRow key={anomaly.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getAnomalyIcon(anomaly.type)}
                      <span className="text-sm">{anomaly.title}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{anomaly.employeeName}</TableCell>
                  <TableCell className="max-w-xs truncate">{anomaly.description}</TableCell>
                  <TableCell>{getSeverityBadge(anomaly.severity)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(anomaly.detectedAt).toLocaleDateString('de-DE')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => resolveAnomaly(anomaly.id, 'Manuell geprüft')}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => dismissAnomaly(anomaly.id)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {unresolvedAnomalies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Keine offenen Anomalien. Führen Sie einen Scan durch.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
