/**
 * Step 2: Beschäftigungsdaten
 */

import { AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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

export function EmploymentDataStep({ formData, errors, onInputChange }: WizardStepProps) {
  const handleWorkDayChange = (dayIndex: number, isWorkDay: boolean) => {
    const updatedWorkDays = [...formData.workDays];
    updatedWorkDays[dayIndex] = { 
      ...updatedWorkDays[dayIndex], 
      isWorkDay,
      hours: isWorkDay ? updatedWorkDays[dayIndex].hours || 8 : 0
    };
    onInputChange('workDays', updatedWorkDays);
  };

  const handleWorkHoursChange = (dayIndex: number, hours: number) => {
    const updatedWorkDays = [...formData.workDays];
    updatedWorkDays[dayIndex] = { 
      ...updatedWorkDays[dayIndex], 
      hours: Math.max(0, hours)
    };
    onInputChange('workDays', updatedWorkDays);
  };

  const getTotalDailyHours = () => {
    return formData.workDays.reduce((sum, day) => sum + (day.isWorkDay ? day.hours : 0), 0);
  };

  const getHoursDifference = () => {
    const totalDaily = getTotalDailyHours();
    return totalDaily - formData.weeklyHours;
  };

  const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const dayNamesFull = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Beschäftigungsdaten</CardTitle>
        <CardDescription>Details zum Arbeitsverhältnis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Beschäftigungsart, Abteilung, Position */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="employmentType">Beschäftigungsart*</Label>
            <Select value={formData.employmentType} onValueChange={(value) => onInputChange('employmentType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minijob">Minijob (bis 556€)</SelectItem>
                <SelectItem value="midijob">Midijob (556,01€ - 2.000€)</SelectItem>
                <SelectItem value="parttime">Teilzeit</SelectItem>
                <SelectItem value="fulltime">Vollzeit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Abteilung*</Label>
            <Select value={formData.department} onValueChange={(value) => onInputChange('department', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Abteilung wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Geschäftsführung">Geschäftsführung</SelectItem>
                <SelectItem value="Verwaltung">Verwaltung</SelectItem>
                <SelectItem value="Buchhaltung">Buchhaltung</SelectItem>
                <SelectItem value="Personalwesen">Personalwesen</SelectItem>
                <SelectItem value="Vertrieb">Vertrieb</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="IT">IT</SelectItem>
                <SelectItem value="Produktion">Produktion</SelectItem>
                <SelectItem value="Logistik">Logistik</SelectItem>
                <SelectItem value="Qualitätssicherung">Qualitätssicherung</SelectItem>
                <SelectItem value="Kundendienst">Kundendienst</SelectItem>
                <SelectItem value="Einkauf">Einkauf</SelectItem>
                <SelectItem value="Forschung & Entwicklung">Forschung & Entwicklung</SelectItem>
                <SelectItem value="Sonstiges">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">Position*</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => onInputChange('position', e.target.value)}
              placeholder="z.B. Sachbearbeiter, Teamleiter"
            />
          </div>
        </div>

        {/* Eintrittsdatum, Wochenstunden, Urlaubstage */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Eintrittsdatum*</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => onInputChange('startDate', e.target.value)}
              className={errors.startDate ? 'border-destructive' : ''}
            />
            <FieldError error={errors.startDate} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weeklyHours">Wochenstunden*</Label>
            <Input
              id="weeklyHours"
              type="number"
              min="1"
              max="60"
              value={formData.weeklyHours}
              onChange={(e) => onInputChange('weeklyHours', parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vacationDays">Urlaubstage pro Jahr*</Label>
            <Input
              id="vacationDays"
              type="number"
              min="20"
              max="50"
              value={formData.vacationDays}
              onChange={(e) => onInputChange('vacationDays', parseInt(e.target.value) || 20)}
            />
          </div>
        </div>

        {/* Compliance Bereich */}
        <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800">Compliance & Rechtliche Anforderungen</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="contractSigned"
                  checked={formData.contractSigned}
                  onCheckedChange={(checked) => onInputChange('contractSigned', checked)}
                />
                <Label htmlFor="contractSigned">Arbeitsvertrag unterschrieben zurückerhalten</Label>
              </div>
              <div className="text-xs text-muted-foreground ml-6">
                Arbeitszeitgesetz-Compliance: Bestätigung für behördliche Prüfungen
              </div>
            </div>
            
            {formData.contractSigned && (
              <div className="space-y-2">
                <Label htmlFor="contractSignedDate">Unterschriftsdatum</Label>
                <Input
                  id="contractSignedDate"
                  type="date"
                  value={formData.contractSignedDate}
                  onChange={(e) => onInputChange('contractSignedDate', e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
            <div className="flex items-start gap-2">
              <div className="text-yellow-600 text-sm">⚠️</div>
              <div className="text-sm">
                <div className="font-medium text-yellow-800">Aufbewahrungsfristen</div>
                <div className="text-yellow-700 text-xs mt-1">
                  Personaldaten müssen 5 Jahre nach Beendigung des Arbeitsverhältnisses für die Rentenversicherung aufbewahrt werden.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Arbeitstage */}
        <div className="space-y-4">
          <Label>Arbeitstage pro Woche*</Label>
          <div className="grid grid-cols-7 gap-2">
            {formData.workDays.map((workDay, index) => (
              <div key={workDay.day} className="flex flex-col items-center space-y-2">
                <Label className="text-sm font-medium">{dayNames[index]}</Label>
                <Checkbox
                  id={`workDay-${workDay.day}`}
                  checked={workDay.isWorkDay}
                  onCheckedChange={(checked) => handleWorkDayChange(index, !!checked)}
                />
                <div className="w-full">
                  <Input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    value={workDay.hours}
                    onChange={(e) => handleWorkHoursChange(index, parseFloat(e.target.value) || 0)}
                    disabled={!workDay.isWorkDay}
                    className="text-center text-xs h-8"
                    placeholder="Std."
                  />
                </div>
                <Label htmlFor={`workDay-${workDay.day}`} className="text-xs text-muted-foreground sr-only">
                  {dayNamesFull[index]}
                </Label>
              </div>
            ))}
          </div>
          
          {/* Stunden-Zusammenfassung */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Stundenübersicht:</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Summe tägliche Stunden:</span>
                <span className="ml-2 font-medium">{getTotalDailyHours().toFixed(1)}h</span>
              </div>
              <div>
                <span className="text-muted-foreground">Wochenstunden (Soll):</span>
                <span className="ml-2 font-medium">{formData.weeklyHours}h</span>
              </div>
            </div>
            {getHoursDifference() !== 0 && (
              <div className={`mt-2 p-2 rounded text-sm ${
                getHoursDifference() > 0 ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {getHoursDifference() > 0 ? '⚠️' : 'ℹ️'} Differenz: {getHoursDifference() > 0 ? '+' : ''}{getHoursDifference().toFixed(1)}h
                {getHoursDifference() > 0 
                  ? ' (Mehr Stunden als geplant)' 
                  : ' (Weniger Stunden als geplant)'
                }
              </div>
            )}
            {getHoursDifference() === 0 && (
              <div className="mt-2 p-2 rounded text-sm bg-green-100 text-green-800">
                ✅ Stundenverteilung stimmt mit Wochenstunden überein
              </div>
            )}
          </div>
        </div>

        {/* Befristung */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isFixedTerm"
            checked={formData.isFixedTerm}
            onCheckedChange={(checked) => onInputChange('isFixedTerm', checked)}
          />
          <Label htmlFor="isFixedTerm">Befristetes Arbeitsverhältnis</Label>
        </div>

        {formData.isFixedTerm && (
          <div className="space-y-2">
            <Label htmlFor="endDate">Austrittsdatum</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => onInputChange('endDate', e.target.value)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
