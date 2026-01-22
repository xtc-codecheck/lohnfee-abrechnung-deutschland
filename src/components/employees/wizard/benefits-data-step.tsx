/**
 * Step 4: Zusatzleistungen
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { WizardStepProps } from './types';

export function BenefitsDataStep({ formData, errors, onInputChange }: WizardStepProps) {
  const calculateCarBenefit = () => {
    if (!formData.carListPrice) return 0;
    
    let rate = 0;
    switch (formData.carType) {
      case 'benzin':
        rate = 1;
        break;
      case 'elektro':
        rate = formData.carListPrice <= 80000 ? 0.25 : 0.5;
        break;
      case 'hybrid':
        rate = 0.5;
        break;
    }
    return (formData.carListPrice * rate) / 100;
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Zusatzleistungen</CardTitle>
        <CardDescription>Geldwerte Vorteile und weitere Lohnbestandteile</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dienstwagen */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="carListPrice">Bruttolistenpreis des Kfz</Label>
            <Input
              id="carListPrice"
              type="number"
              min="0"
              step="0.01"
              value={formData.carListPrice}
              onChange={(e) => onInputChange('carListPrice', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carType">Fahrzeugtyp</Label>
            <Select value={formData.carType} onValueChange={(value) => onInputChange('carType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Fahrzeugtyp wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="benzin">Benzin/Diesel (1%)</SelectItem>
                <SelectItem value="elektro">Elektrofahrzeug (0,25% bis 80.000€, 0,5% über 80.000€)</SelectItem>
                <SelectItem value="hybrid">Hybrid (0,5%)</SelectItem>
              </SelectContent>
            </Select>
            {formData.carListPrice > 0 && (
              <div className="text-sm text-muted-foreground">
                Geldwerter Vorteil: {calculateCarBenefit().toFixed(2)}€ pro Monat
              </div>
            )}
          </div>
        </div>

        {/* Boni/Prämien */}
        <div className="space-y-2">
          <Label>Boni/Prämien</Label>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="yearlyBonusPercent" className="text-sm">Jahresboni (%)</Label>
                <Input
                  id="yearlyBonusPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.yearlyBonusPercent}
                  onChange={(e) => onInputChange('yearlyBonusPercent', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="yearlyBonusFixed" className="text-sm">Jahresboni fix (€)</Label>
                <Input
                  id="yearlyBonusFixed"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.yearlyBonusFixed}
                  onChange={(e) => onInputChange('yearlyBonusFixed', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            {/* 13./14. Gehalt */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has13thSalary"
                    checked={formData.has13thSalary}
                    onCheckedChange={(checked) => onInputChange('has13thSalary', checked)}
                  />
                  <Label htmlFor="has13thSalary" className="text-sm">13. Monatsgehalt</Label>
                </div>
                {formData.has13thSalary && (
                  <div>
                    <Label htmlFor="factor13thSalary" className="text-xs">Faktor</Label>
                    <Input
                      id="factor13thSalary"
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={formData.factor13thSalary}
                      onChange={(e) => onInputChange('factor13thSalary', parseFloat(e.target.value) || 1)}
                      placeholder="1.0"
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has14thSalary"
                    checked={formData.has14thSalary}
                    onCheckedChange={(checked) => onInputChange('has14thSalary', checked)}
                  />
                  <Label htmlFor="has14thSalary" className="text-sm">14. Monatsgehalt</Label>
                </div>
                {formData.has14thSalary && (
                  <div>
                    <Label htmlFor="factor14thSalary" className="text-xs">Faktor</Label>
                    <Input
                      id="factor14thSalary"
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={formData.factor14thSalary}
                      onChange={(e) => onInputChange('factor14thSalary', parseFloat(e.target.value) || 1)}
                      placeholder="1.0"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sachbezüge & Fahrtkostenerstattung */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="benefits">Sachbezüge</Label>
            <Input
              id="benefits"
              type="number"
              min="0"
              step="0.01"
              value={formData.benefits}
              onChange={(e) => onInputChange('benefits', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
            <div className="flex items-center space-x-2">
              <Checkbox
                id="benefitsCompliant"
                checked={formData.benefitsCompliant}
                onCheckedChange={(checked) => onInputChange('benefitsCompliant', checked)}
              />
              <Label htmlFor="benefitsCompliant" className="text-sm">Compliance-Check erfüllt</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="travelExpenses">Fahrtkostenerstattung</Label>
            <Input
              id="travelExpenses"
              type="number"
              min="0"
              step="0.01"
              value={formData.travelExpenses}
              onChange={(e) => onInputChange('travelExpenses', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* bAV & VL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="companyPension">Betriebliche Altersvorsorge (bAV)</Label>
            <Input
              id="companyPension"
              type="number"
              min="0"
              step="0.01"
              value={formData.companyPension}
              onChange={(e) => onInputChange('companyPension', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="capitalFormingBenefits">Vermögenswirksame Leistungen (VL)</Label>
            <Input
              id="capitalFormingBenefits"
              type="number"
              min="0"
              step="0.01"
              value={formData.capitalFormingBenefits}
              onChange={(e) => onInputChange('capitalFormingBenefits', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Steuerfreie Leistungen */}
        <div className="space-y-2">
          <Label htmlFor="taxFreeBenefits">Steuerfreie Leistungen</Label>
          <Input
            id="taxFreeBenefits"
            type="number"
            min="0"
            step="0.01"
            value={formData.taxFreeBenefits}
            onChange={(e) => onInputChange('taxFreeBenefits', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
          />
        </div>
      </CardContent>
    </Card>
  );
}
