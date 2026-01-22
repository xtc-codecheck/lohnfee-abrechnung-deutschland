/**
 * Branchenspezifische Payroll-Eingaben
 * 
 * Komponente für zusätzliche Eingabefelder basierend auf der Mitarbeiter-Branche
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  HardHat, 
  UtensilsCrossed, 
  Stethoscope,
  Info,
  AlertTriangle
} from 'lucide-react';
import { Employee, IndustryType } from '@/types/employee';
import { IndustryPayrollInput, IndustryPayrollResult, INDUSTRY_LABELS } from '@/hooks/use-industry-payroll';

interface IndustryPayrollInputsProps {
  employee: Employee;
  input: IndustryPayrollInput;
  result?: IndustryPayrollResult;
  onChange: (input: Partial<IndustryPayrollInput>) => void;
}

export function IndustryPayrollInputs({ 
  employee, 
  input, 
  result,
  onChange 
}: IndustryPayrollInputsProps) {
  const industry = employee.employmentData.industry ?? 'standard';
  
  if (industry === 'standard') {
    return null;
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

  const getIndustryIcon = () => {
    switch (industry) {
      case 'construction': return <HardHat className="h-5 w-5" />;
      case 'gastronomy': return <UtensilsCrossed className="h-5 w-5" />;
      case 'nursing': return <Stethoscope className="h-5 w-5" />;
      default: return null;
    }
  };

  const getIndustryColor = () => {
    switch (industry) {
      case 'construction': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'gastronomy': return 'bg-amber-100 border-amber-300 text-amber-800';
      case 'nursing': return 'bg-blue-100 border-blue-300 text-blue-800';
      default: return '';
    }
  };

  return (
    <Card className={`border-2 ${getIndustryColor()}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          {getIndustryIcon()}
          {INDUSTRY_LABELS[industry]} - Branchenspezifische Daten
        </CardTitle>
        <CardDescription>
          Zusätzliche Angaben für die branchenspezifische Berechnung
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Baulohn */}
        {industry === 'construction' && (
          <ConstructionInputs input={input} onChange={onChange} />
        )}
        
        {/* Gastronomie */}
        {industry === 'gastronomy' && (
          <GastronomyInputs input={input} onChange={onChange} />
        )}
        
        {/* Pflege */}
        {industry === 'nursing' && (
          <NursingInputs input={input} onChange={onChange} />
        )}
        
        {/* Ergebnis-Zusammenfassung */}
        {result && result.additionalGross > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Info className="h-4 w-4" />
                Branchenspezifische Zuschläge
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span>Steuerpflichtige Zulagen:</span>
                <span className="text-right font-medium">{formatCurrency(result.taxableAdditions)}</span>
                
                <span>Steuerfreie Zulagen:</span>
                <span className="text-right font-medium text-green-600">{formatCurrency(result.taxFreeAdditions)}</span>
                
                <span className="font-medium">Gesamt zusätzlich:</span>
                <span className="text-right font-bold">{formatCurrency(result.additionalGross)}</span>
              </div>
              
              {result.employerAdditionalCosts > 0 && (
                <div className="text-xs text-muted-foreground mt-2">
                  AG-Zusatzkosten: {formatCurrency(result.employerAdditionalCosts)}
                </div>
              )}
            </div>
          </>
        )}
        
        {/* Warnungen */}
        {result?.warnings && result.warnings.length > 0 && (
          <Alert variant="default" className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <ul className="list-disc list-inside space-y-1">
                {result.warnings.map((warning, idx) => (
                  <li key={idx} className="text-sm">{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// ============= Baulohn Eingaben =============

function ConstructionInputs({ 
  input, 
  onChange 
}: { 
  input: IndustryPayrollInput; 
  onChange: (input: Partial<IndustryPayrollInput>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="winterHours">Wintergeld-Stunden</Label>
          <Input
            id="winterHours"
            type="number"
            min="0"
            value={input.winterHours ?? 0}
            onChange={(e) => onChange({ winterHours: parseFloat(e.target.value) || 0 })}
            placeholder="0"
          />
          <span className="text-xs text-muted-foreground">1,00€/Std. (Dez-März)</span>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="dirtyWorkHours">Schmutzzulage</Label>
          <Input
            id="dirtyWorkHours"
            type="number"
            min="0"
            value={input.dirtyWorkHours ?? 0}
            onChange={(e) => onChange({ dirtyWorkHours: parseFloat(e.target.value) || 0 })}
            placeholder="0"
          />
          <span className="text-xs text-muted-foreground">Stunden</span>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="heightWorkHours">Höhenzulage</Label>
          <Input
            id="heightWorkHours"
            type="number"
            min="0"
            value={input.heightWorkHours ?? 0}
            onChange={(e) => onChange({ heightWorkHours: parseFloat(e.target.value) || 0 })}
            placeholder="0"
          />
          <span className="text-xs text-muted-foreground">Stunden (&gt;7m)</span>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="dangerWorkHours">Gefahrenzulage</Label>
          <Input
            id="dangerWorkHours"
            type="number"
            min="0"
            value={input.dangerWorkHours ?? 0}
            onChange={(e) => onChange({ dangerWorkHours: parseFloat(e.target.value) || 0 })}
            placeholder="0"
          />
          <span className="text-xs text-muted-foreground">Stunden</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vacationDaysTaken">Urlaubstage (genommen)</Label>
          <Input
            id="vacationDaysTaken"
            type="number"
            min="0"
            value={input.vacationDaysTaken ?? 0}
            onChange={(e) => onChange({ vacationDaysTaken: parseFloat(e.target.value) || 0 })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="previousYearVacationDays">Resturlaub Vorjahr</Label>
          <Input
            id="previousYearVacationDays"
            type="number"
            min="0"
            value={input.previousYearVacationDays ?? 0}
            onChange={(e) => onChange({ previousYearVacationDays: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>
      
      <div className="flex gap-2 flex-wrap">
        <Badge variant="outline">SOKA-BAU: 15,20% AG</Badge>
        <Badge variant="outline">Urlaubskasse</Badge>
        <Badge variant="outline">Winterbau-Umlage: 1,0%</Badge>
      </div>
    </div>
  );
}

// ============= Gastronomie Eingaben =============

function GastronomyInputs({ 
  input, 
  onChange 
}: { 
  input: IndustryPayrollInput; 
  onChange: (input: Partial<IndustryPayrollInput>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="breakfastsProvided">Frühstücke</Label>
          <Input
            id="breakfastsProvided"
            type="number"
            min="0"
            value={input.breakfastsProvided ?? 0}
            onChange={(e) => onChange({ breakfastsProvided: parseInt(e.target.value) || 0 })}
          />
          <span className="text-xs text-muted-foreground">à 2,17€</span>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lunchesProvided">Mittagessen</Label>
          <Input
            id="lunchesProvided"
            type="number"
            min="0"
            value={input.lunchesProvided ?? 0}
            onChange={(e) => onChange({ lunchesProvided: parseInt(e.target.value) || 0 })}
          />
          <span className="text-xs text-muted-foreground">à 4,13€</span>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="dinnersProvided">Abendessen</Label>
          <Input
            id="dinnersProvided"
            type="number"
            min="0"
            value={input.dinnersProvided ?? 0}
            onChange={(e) => onChange({ dinnersProvided: parseInt(e.target.value) || 0 })}
          />
          <span className="text-xs text-muted-foreground">à 4,13€</span>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="monthlyTips">Trinkgeld (€)</Label>
          <Input
            id="monthlyTips"
            type="number"
            min="0"
            step="10"
            value={input.monthlyTips ?? 0}
            onChange={(e) => onChange({ monthlyTips: parseFloat(e.target.value) || 0 })}
          />
          <span className="text-xs text-muted-foreground">pro Monat</span>
        </div>
      </div>
      
      <div className="flex gap-2 flex-wrap">
        <Badge variant="outline" className="bg-green-50 text-green-700">
          Trinkgeld von Gästen = steuerfrei
        </Badge>
        <Badge variant="outline">Sachbezug Mahlzeiten 2025</Badge>
      </div>
    </div>
  );
}

// ============= Pflege Eingaben =============

function NursingInputs({ 
  input, 
  onChange 
}: { 
  input: IndustryPayrollInput; 
  onChange: (input: Partial<IndustryPayrollInput>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="onCallHours">Bereitschaftsstunden</Label>
          <Input
            id="onCallHours"
            type="number"
            min="0"
            value={input.onCallHours ?? 0}
            onChange={(e) => onChange({ onCallHours: parseFloat(e.target.value) || 0 })}
          />
          <span className="text-xs text-muted-foreground">Vergütung: 25%</span>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="weekendDays">Wochenend-Tage</Label>
          <Input
            id="weekendDays"
            type="number"
            min="0"
            max="10"
            value={input.weekendDays ?? 0}
            onChange={(e) => onChange({ weekendDays: parseInt(e.target.value) || 0 })}
          />
          <span className="text-xs text-muted-foreground">gearbeitet</span>
        </div>
      </div>
      
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-sm">
          SFN-Zuschläge werden automatisch aus den Arbeitszeiten berechnet:
          <br />• Nacht (20-6 Uhr): 25% steuerfrei
          <br />• Sonntag: 50% steuerfrei  
          <br />• Feiertag: 125% steuerfrei
        </AlertDescription>
      </Alert>
      
      <div className="flex gap-2 flex-wrap">
        <Badge variant="outline" className="bg-green-50 text-green-700">
          SFN-Zuschläge steuerfrei
        </Badge>
        <Badge variant="outline">TVöD-P Schichtzulagen</Badge>
      </div>
    </div>
  );
}
