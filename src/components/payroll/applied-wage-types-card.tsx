import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Receipt } from 'lucide-react';
import { EmployeeWageType, CATEGORY_LABELS, WageTypeCategory } from '@/types/wage-types';
import { applyWageTypes } from '@/utils/wage-types-integration';
import { formatCurrency } from '@/lib/formatters';

interface AppliedWageTypesCardProps {
  items: EmployeeWageType[] | undefined;
  reference: Date;
}

/**
 * Zeigt die in einer Abrechnung berücksichtigten Lohnarten und ihre Wirkung
 * (Brutto-erhöhend, Netto-Abzug, steuerfrei, Pauschalsteuer).
 */
export function AppliedWageTypesCard({ items, reference }: AppliedWageTypesCardProps) {
  if (!items || items.length === 0) return null;
  const impact = applyWageTypes(items, reference);
  if (impact.lineItems.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Receipt className="h-4 w-4" />
          Angewandte Lohnarten ({impact.lineItems.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-1.5">
          {impact.lineItems.map((li, i) => (
            <div key={i} className="flex items-center justify-between text-sm border-b border-border/40 pb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <Badge variant="outline" className="text-xs shrink-0">{li.code}</Badge>
                <span className="truncate">{li.name}</span>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {CATEGORY_LABELS[li.category as WageTypeCategory] ?? li.category}
                </Badge>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {li.pauschalTaxAmount ? (
                  <span className="text-xs text-muted-foreground">
                    + {formatCurrency(li.pauschalTaxAmount)} pauschale LSt
                  </span>
                ) : null}
                <span className="font-mono">{formatCurrency(li.amount)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
          {impact.taxableGrossAddition > 0 && (
            <div className="flex justify-between"><span className="text-muted-foreground">Brutto-Erhöhung:</span><span className="font-mono">{formatCurrency(impact.taxableGrossAddition)}</span></div>
          )}
          {impact.taxFreeNetAddition > 0 && (
            <div className="flex justify-between"><span className="text-muted-foreground">Steuerfrei netto:</span><span className="font-mono">{formatCurrency(impact.taxFreeNetAddition)}</span></div>
          )}
          {impact.netDeductions > 0 && (
            <div className="flex justify-between"><span className="text-muted-foreground">Netto-Abzüge:</span><span className="font-mono">-{formatCurrency(impact.netDeductions)}</span></div>
          )}
          {impact.inKindDeduction > 0 && (
            <div className="flex justify-between"><span className="text-muted-foreground">Sachbezug-Abzug:</span><span className="font-mono">-{formatCurrency(impact.inKindDeduction)}</span></div>
          )}
          {impact.pauschalTax > 0 && (
            <div className="flex justify-between"><span className="text-muted-foreground">Pauschalsteuer (AG):</span><span className="font-mono">{formatCurrency(impact.pauschalTax)}</span></div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}