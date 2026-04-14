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
    ? 'text-green-600'
    : result.score >= 50
    ? 'text-yellow-600'
    : 'text-red-600';

  const progressColor = result.score >= 80
    ? '[&>div]:bg-green-500'
    : result.score >= 50
    ? '[&>div]:bg-yellow-500'
    : '[&>div]:bg-red-500';

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
          <span className="flex items-center gap-1 text-red-600">
            <XCircle className="h-3 w-3" /> {result.errors.length} Fehler
          </span>
          <span className="flex items-center gap-1 text-yellow-600">
            <AlertTriangle className="h-3 w-3" /> {result.warnings.length} Warnungen
          </span>
          <span className="flex items-center gap-1 text-blue-600">
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
          <div className="flex items-center gap-2 text-sm text-green-600">
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
  const color = issue.severity === 'error' ? 'text-red-600'
    : issue.severity === 'warning' ? 'text-yellow-600'
    : 'text-blue-600';

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
