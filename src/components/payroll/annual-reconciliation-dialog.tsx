/**
 * Jahresausgleich-Dialog (§ 42b EStG)
 * Berechnet die Differenz zwischen Summe monatlicher Lohnsteuern
 * und der korrekten Jahressteuer auf das tatsächliche Jahresbrutto.
 */
import { useState } from 'react';
import { Loader2, ArrowDown, ArrowUp, Equal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/tenant-context';
import { calculateAnnualTaxReconciliation, AnnualReconciliationResult } from '@/utils/annual-tax-reconciliation';

interface AnnualReconciliationDialogProps {
  employeeId: string;
  employeeName: string;
  taxParams: any;
}

const fmt = (v: number) => v.toFixed(2).replace('.', ',') + ' €';
const sign = (v: number) => (v > 0 ? '+' : '') + fmt(v);

export function AnnualReconciliationDialog({ employeeId, employeeName, taxParams }: AnnualReconciliationDialogProps) {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnnualReconciliationResult | null>(null);

  const handleCalculate = async () => {
    if (!tenantId) return;
    setLoading(true);
    setResult(null);

    // Alle Payroll-Perioden des Jahres laden
    const { data: periods } = await supabase
      .from('payroll_periods')
      .select('id, month')
      .eq('year', year)
      .eq('tenant_id', tenantId)
      .order('month');

    if (!periods?.length) {
      toast({ title: 'Keine Daten', description: `Keine Abrechnungen für ${year}.`, variant: 'destructive' });
      setLoading(false);
      return;
    }

    const periodIds = periods.map(p => p.id);

    const { data: entries } = await supabase
      .from('payroll_entries')
      .select('gross_salary, tax_income_tax, tax_solidarity, tax_church, payroll_period_id')
      .eq('employee_id', employeeId)
      .in('payroll_period_id', periodIds)
      .eq('tenant_id', tenantId);

    if (!entries?.length) {
      toast({ title: 'Keine Einträge', description: 'Keine Abrechnungen für diesen MA.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Monatliche Arrays aufbauen (12 Monate, fehlende = 0)
    const monthlyGross = new Array(12).fill(0);
    const monthlyTax = new Array(12).fill(0);
    const monthlySoli = new Array(12).fill(0);
    const monthlyChurch = new Array(12).fill(0);

    const periodMonthMap = new Map(periods.map(p => [p.id, p.month]));
    for (const e of entries) {
      const m = (periodMonthMap.get(e.payroll_period_id) ?? 1) - 1;
      monthlyGross[m] += Number(e.gross_salary);
      monthlyTax[m] += Number(e.tax_income_tax ?? 0);
      monthlySoli[m] += Number(e.tax_solidarity ?? 0);
      monthlyChurch[m] += Number(e.tax_church ?? 0);
    }

    const reconciliation = calculateAnnualTaxReconciliation({
      monthlyGrossSalaries: monthlyGross,
      monthlyTaxesWithheld: monthlyTax,
      monthlySoliWithheld: monthlySoli,
      monthlyChurchTaxWithheld: monthlyChurch,
      taxParams: { ...taxParams, year },
    });

    setResult(reconciliation);
    setLoading(false);
  };

  const DiffIcon = result
    ? result.totalDifference < -0.01 ? ArrowDown
    : result.totalDifference > 0.01 ? ArrowUp
    : Equal
    : Equal;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">§ 42b Jahresausgleich</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Lohnsteuer-Jahresausgleich</DialogTitle>
          <DialogDescription>{employeeName} – § 42b EStG</DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 items-end">
          <Select value={String(year)} onValueChange={v => { setYear(Number(v)); setResult(null); }}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={handleCalculate} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Berechnen
          </Button>
        </div>

        {result && (
          <div className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-4 space-y-2">
                <Row label="Jahresbrutto" value={fmt(result.annualGross)} />
                <Separator />
                <Row label="∑ Monatl. LSt" value={fmt(result.totalMonthlyTaxWithheld)} />
                <Row label="Korrekte Jahres-LSt" value={fmt(result.correctAnnualTax)} bold />
                <Row label="Differenz LSt" value={sign(result.taxDifference)} diff={result.taxDifference} />
                <Separator />
                <Row label="Differenz Soli" value={sign(result.soliDifference)} diff={result.soliDifference} />
                <Row label="Differenz KiSt" value={sign(result.churchTaxDifference)} diff={result.churchTaxDifference} />
                <Separator />
                <div className="flex justify-between items-center font-bold text-base">
                  <span className="flex items-center gap-2">
                    <DiffIcon className="h-4 w-4" />
                    Gesamtdifferenz
                  </span>
                  <Badge variant={result.totalDifference < -0.01 ? 'default' : result.totalDifference > 0.01 ? 'destructive' : 'secondary'}>
                    {sign(result.totalDifference)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {result.totalDifference < -0.01
                    ? '→ Erstattung an Mitarbeiter (Überzahlung)'
                    : result.totalDifference > 0.01
                    ? '→ Nachzahlung vom Mitarbeiter (Unterzahlung)'
                    : '→ Kein Ausgleich erforderlich'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, bold, diff }: { label: string; value: string; bold?: boolean; diff?: number }) {
  const color = diff !== undefined ? (diff < -0.01 ? 'text-green-600' : diff > 0.01 ? 'text-red-600' : '') : '';
  return (
    <div className={`flex justify-between text-sm ${bold ? 'font-semibold' : ''}`}>
      <span>{label}</span>
      <span className={`tabular-nums ${color}`}>{value}</span>
    </div>
  );
}
