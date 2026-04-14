/**
 * Step 4: Zusatzleistungen
 */

import { AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LabelWithHelp } from '@/components/ui/help-tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { HELP } from '@/constants/help-glossary';
import { WizardStepProps } from './types';

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="text-sm text-destructive flex items-center gap-1 mt-1">
      <AlertCircle className="h-3 w-3" />
      {error}
    </p>
  );
}

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
            <LabelWithHelp htmlFor="carListPrice" help={HELP.companyCarListPrice.help} example={HELP.companyCarListPrice.example}>
              Bruttolistenpreis des Kfz
            </LabelWithHelp>
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
            <LabelWithHelp htmlFor="carType" help={HELP.companyCarType.help}>
              Fahrzeugtyp
            </LabelWithHelp>
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
                  <LabelWithHelp htmlFor="has13thSalary" help={HELP.bonus13th.help}>
                    13. Monatsgehalt
                  </LabelWithHelp>
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
            <LabelWithHelp htmlFor="benefits" help={HELP.sachbezuege.help} example={HELP.sachbezuege.example}>
              Sachbezüge
            </LabelWithHelp>
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
            <LabelWithHelp htmlFor="travelExpenses" help={HELP.travelExpenses.help} example={HELP.travelExpenses.example}>
              Fahrtkostenerstattung
            </LabelWithHelp>
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
            <LabelWithHelp htmlFor="companyPension" help={HELP.bav.help} example={HELP.bav.example} hint={HELP.bav.hint}>
              Betriebliche Altersvorsorge (bAV)
            </LabelWithHelp>
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
            <LabelWithHelp htmlFor="capitalFormingBenefits" help={HELP.vl.help} example={HELP.vl.example} hint={HELP.vl.hint}>
              Vermögenswirksame Leistungen (VL)
            </LabelWithHelp>
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
          <LabelWithHelp htmlFor="taxFreeBenefits" help={HELP.taxFreeBenefits.help}>
            Steuerfreie Leistungen
          </LabelWithHelp>
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

        {/* Bankdaten */}
        <div className="border-t pt-6">
          <h3 className="font-medium mb-4">Bankverbindung</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <LabelWithHelp htmlFor="iban" help={HELP.iban.help} example={HELP.iban.example} hint={HELP.iban.hint}>
                IBAN
              </LabelWithHelp>
              <Input
                id="iban"
                value={formData.iban}
                onChange={(e) => onInputChange('iban', e.target.value.toUpperCase())}
                placeholder="DE89370400440532013000"
                className={errors.iban ? 'border-destructive' : ''}
              />
              <FieldError error={errors.iban} />
            </div>
            <div className="space-y-2">
              <LabelWithHelp htmlFor="bic" help={HELP.bic.help} example={HELP.bic.example}>
                BIC
              </LabelWithHelp>
              <Input
                id="bic"
                value={formData.bic}
                onChange={(e) => onInputChange('bic', e.target.value.toUpperCase())}
                placeholder="COBADEFFXXX"
              />
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <Label htmlFor="bankName">Bankname</Label>
            <Input
              id="bankName"
              value={formData.bankName}
              onChange={(e) => onInputChange('bankName', e.target.value)}
              placeholder="Commerzbank"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
