/**
 * ELStAM-Validierungskarte für Mitarbeiterdetails
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { validateELStAM, ELStAMInput, ELStAMIssue } from '@/utils/elstam-validation';

interface ELStAMValidationCardProps {
  employeeData: {
    taxId: string;
    taxClass: number;
    churchTax: boolean;
    churchTaxRate?: number;
    childAllowances: number;
    numberOfChildren: number;
    dateOfBirth: string;
    entryDate: string;
    exitDate?: string;
    svNumber: string;
    healthInsurance: string;
    grossSalary: number;
    isActive: boolean;
  };
}

export function ELStAMValidationCard({ employeeData }: ELStAMValidationCardProps) {
  const result = useMemo(() => validateELStAM(employeeData), [employeeData]);

  const scoreColor = result.score >= 80
    ? 'text-success'
    : result.score >= 50
    ? 'text-warning'
    : 'text-destructive';

  const progressColor = result.score >= 80
    ? '[&>div]:bg-success'
    : result.score >= 50
    ? '[&>div]:bg-warning'
    : '[&>div]:bg-destructive';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            ELStAM-Validierung
          </span>
          <Badge variant={result.isValid ? 'default' : 'destructive'}>
            {result.isValid ? 'Gültig' : 'Fehler'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span>Datenqualität</span>
          <span className={`font-bold ${scoreColor}`}>{result.score}%</span>
        </div>
        <Progress value={result.score} className={progressColor} />

        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1 text-destructive">
            <XCircle className="h-3 w-3" /> {result.errors.length} Fehler
          </span>
          <span className="flex items-center gap-1 text-warning">
            <AlertTriangle className="h-3 w-3" /> {result.warnings.length} Warnungen
          </span>
          <span className="flex items-center gap-1 text-info">
            <Info className="h-3 w-3" /> {result.infos.length} Hinweise
          </span>
        </div>

        {result.errors.length > 0 && (
          <div className="space-y-1">
            {result.errors.map(issue => (
              <IssueRow key={issue.code} issue={issue} />
            ))}
          </div>
        )}
        {result.warnings.length > 0 && (
          <div className="space-y-1">
            {result.warnings.map(issue => (
              <IssueRow key={issue.code} issue={issue} />
            ))}
          </div>
        )}
        {result.infos.length > 0 && (
          <div className="space-y-1">
            {result.infos.map(issue => (
              <IssueRow key={issue.code} issue={issue} />
            ))}
          </div>
        )}

        {result.isValid && result.errors.length === 0 && result.warnings.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-success">
            <CheckCircle className="h-4 w-4" />
            Alle ELStAM-Daten sind korrekt.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function IssueRow({ issue }: { issue: ELStAMIssue }) {
  const Icon = issue.severity === 'error' ? XCircle
    : issue.severity === 'warning' ? AlertTriangle
    : Info;
  const color = issue.severity === 'error' ? 'text-destructive'
    : issue.severity === 'warning' ? 'text-warning'
    : 'text-info';

  return (
    <div className={`flex items-start gap-2 text-xs ${color}`}>
      <Icon className="h-3 w-3 mt-0.5 flex-shrink-0" />
      <div>
        <span>{issue.message}</span>
        {issue.legalBasis && (
          <span className="text-muted-foreground ml-1">({issue.legalBasis})</span>
        )}
      </div>
    </div>
  );
}
