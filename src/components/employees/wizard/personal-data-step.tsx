/**
 * Step 1: Persönliche Daten
 */

import { useState } from 'react';
import { Check, ChevronsUpDown, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  CHURCH_TAX_RATES, 
  GERMAN_STATES, 
  GERMAN_STATE_NAMES, 
  GERMAN_HEALTH_INSURANCES 
} from '@/types/employee';
import { WizardStepProps } from './types';

// Fehleranzeige
function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="text-sm text-destructive flex items-center gap-1 mt-1">
      <AlertCircle className="h-3 w-3" />
      {error}
    </p>
  );
}

export function PersonalDataStep({ formData, errors, onInputChange }: WizardStepProps) {
  const [openHealthInsurance, setOpenHealthInsurance] = useState(false);

  const getChurchTaxRate = () => {
    if (!formData.religion || !formData.state) return 0;
    return CHURCH_TAX_RATES[formData.state]?.[formData.religion] || 0;
  };

  const handleHealthInsuranceSelect = (insuranceName: string) => {
    const selectedInsurance = GERMAN_HEALTH_INSURANCES.find(ins => ins.name === insuranceName);
    onInputChange('healthInsurance', insuranceName);
    if (selectedInsurance) {
      onInputChange('healthInsuranceRate', selectedInsurance.additionalRate);
    }
    setOpenHealthInsurance(false);
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Persönliche Daten</CardTitle>
        <CardDescription>Grundlegende Informationen zum Mitarbeiter</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Vorname*</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => onInputChange('firstName', e.target.value)}
              placeholder="Max"
              className={errors.firstName ? 'border-destructive' : ''}
            />
            <FieldError error={errors.firstName} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Nachname*</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => onInputChange('lastName', e.target.value)}
              placeholder="Mustermann"
              className={errors.lastName ? 'border-destructive' : ''}
            />
            <FieldError error={errors.lastName} />
          </div>
        </div>

        {/* Geburtsdatum & Geschlecht */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Geburtsdatum*</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => onInputChange('dateOfBirth', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Geschlecht*</Label>
            <Select value={formData.gender} onValueChange={(value) => onInputChange('gender', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Geschlecht wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Männlich</SelectItem>
                <SelectItem value="female">Weiblich</SelectItem>
                <SelectItem value="diverse">Divers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Adresse */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="street">Straße*</Label>
            <Input
              id="street"
              value={formData.street}
              onChange={(e) => onInputChange('street', e.target.value)}
              placeholder="Musterstraße"
              className={errors.street ? 'border-destructive' : ''}
            />
            <FieldError error={errors.street} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="houseNumber">Nr.*</Label>
            <Input
              id="houseNumber"
              value={formData.houseNumber}
              onChange={(e) => onInputChange('houseNumber', e.target.value)}
              placeholder="123"
              className={errors.houseNumber ? 'border-destructive' : ''}
            />
            <FieldError error={errors.houseNumber} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">PLZ*</Label>
            <Input
              id="postalCode"
              value={formData.postalCode}
              onChange={(e) => onInputChange('postalCode', e.target.value)}
              placeholder="12345"
              className={errors.postalCode ? 'border-destructive' : ''}
            />
            <FieldError error={errors.postalCode} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">Stadt*</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => onInputChange('city', e.target.value)}
              placeholder="Berlin"
              className={errors.city ? 'border-destructive' : ''}
            />
            <FieldError error={errors.city} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">Bundesland*</Label>
            <Select value={formData.state} onValueChange={(value) => onInputChange('state', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Bundesland wählen" />
              </SelectTrigger>
              <SelectContent>
                {GERMAN_STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {GERMAN_STATE_NAMES[state]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Land*</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => onInputChange('country', e.target.value)}
              placeholder="Deutschland"
            />
          </div>
        </div>

        {/* Kontakt */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefonnummer</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => onInputChange('phone', e.target.value)}
              placeholder="+49 123 456789"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail-Adresse</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => onInputChange('email', e.target.value)}
              placeholder="max.mustermann@email.de"
            />
          </div>
        </div>

        {/* Steuer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="taxId">Steuer-ID*</Label>
            <Input
              id="taxId"
              value={formData.taxId}
              onChange={(e) => onInputChange('taxId', e.target.value)}
              placeholder="12345678901"
              className={errors.taxId ? 'border-destructive' : ''}
            />
            <FieldError error={errors.taxId} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxClass">Steuerklasse*</Label>
            <Select value={formData.taxClass} onValueChange={(value) => onInputChange('taxClass', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="I">Klasse I</SelectItem>
                <SelectItem value="II">Klasse II</SelectItem>
                <SelectItem value="III">Klasse III</SelectItem>
                <SelectItem value="IV">Klasse IV</SelectItem>
                <SelectItem value="V">Klasse V</SelectItem>
                <SelectItem value="VI">Klasse VI</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Beziehungsstatus & Religion */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="relationshipStatus">Beziehungsstatus*</Label>
            <Select value={formData.relationshipStatus} onValueChange={(value) => onInputChange('relationshipStatus', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Ledig</SelectItem>
                <SelectItem value="married">Verheiratet</SelectItem>
                <SelectItem value="divorced">Geschieden</SelectItem>
                <SelectItem value="widowed">Verwitwet</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="religion">Religionszugehörigkeit</Label>
            <Select value={formData.religion} onValueChange={(value) => onInputChange('religion', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keine/Andere</SelectItem>
                <SelectItem value="catholic">Römisch-katholisch</SelectItem>
                <SelectItem value="protestant">Evangelisch</SelectItem>
                <SelectItem value="old-catholic">Altkatholische Kirche</SelectItem>
                <SelectItem value="jewish">Jüdische Kultusgemeinden</SelectItem>
                <SelectItem value="free-religious">Freireligiöse Gemeinden</SelectItem>
                <SelectItem value="other">Sonstige</SelectItem>
              </SelectContent>
            </Select>
            {getChurchTaxRate() > 0 && (
              <div className="text-sm text-muted-foreground">
                Kirchensteuersatz: {getChurchTaxRate()}%
              </div>
            )}
          </div>
        </div>

        {/* Beziehungsdatum (konditional) */}
        {(formData.relationshipStatus === 'married' || formData.relationshipStatus === 'divorced' || formData.relationshipStatus === 'widowed') && (
          <div className="space-y-2">
            <Label htmlFor="relationshipDate">
              {formData.relationshipStatus === 'married' ? 'Hochzeitsdatum' : 
               formData.relationshipStatus === 'divorced' ? 'Scheidungsdatum' : 'Todesdatum Partner'}
            </Label>
            <Input
              id="relationshipDate"
              type="date"
              value={formData.relationshipDate}
              onChange={(e) => onInputChange('relationshipDate', e.target.value)}
            />
          </div>
        )}

        {/* Sozialversicherung & Kinder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="socialSecurityNumber">Sozialversicherungsnummer</Label>
            <Input
              id="socialSecurityNumber"
              value={formData.socialSecurityNumber}
              onChange={(e) => onInputChange('socialSecurityNumber', e.target.value)}
              placeholder="12345678901"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="childAllowances">Kinderfreibeträge</Label>
            <Input
              id="childAllowances"
              type="number"
              min="0"
              step="0.5"
              value={formData.childAllowances}
              onChange={(e) => onInputChange('childAllowances', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Krankenkasse */}
        <div className="space-y-2">
          <Label htmlFor="healthInsurance">Krankenkasse*</Label>
          <Popover open={openHealthInsurance} onOpenChange={setOpenHealthInsurance}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openHealthInsurance}
                className={cn(
                  'w-full justify-between',
                  errors.healthInsurance && 'border-destructive'
                )}
              >
                {formData.healthInsurance
                  ? GERMAN_HEALTH_INSURANCES.find((ins) => ins.name === formData.healthInsurance)?.name
                  : 'Krankenkasse wählen...'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Krankenkasse suchen..." />
                <CommandList>
                  <CommandEmpty>Keine Krankenkasse gefunden.</CommandEmpty>
                  <CommandGroup>
                    {GERMAN_HEALTH_INSURANCES.map((insurance) => (
                      <CommandItem
                        key={insurance.name}
                        value={insurance.name}
                        onSelect={handleHealthInsuranceSelect}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            formData.healthInsurance === insurance.name ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <div className="flex-1">
                          <div>{insurance.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Zusatzbeitrag: {insurance.additionalRate}%
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FieldError error={errors.healthInsurance} />
        </div>
      </CardContent>
    </Card>
  );
}
