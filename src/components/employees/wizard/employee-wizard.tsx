/**
 * Employee Wizard - Multi-Step Formular
 * 
 * Modularer Wizard für Mitarbeiter-Erfassung mit 4 Schritten:
 * 1. Persönliche Daten
 * 2. Beschäftigungsdaten
 * 3. Gehaltsdaten
 * 4. Zusatzleistungen
 */

import { useState, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Save, Calculator, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/hooks/use-toast';
import { useEmployeeStorage } from '@/hooks/use-employee-storage';
import { validateEmployeeForm } from '@/lib/validations/employee';

import { WizardProgress } from './wizard-progress';
import { PersonalDataStep } from './personal-data-step';
import { EmploymentDataStep } from './employment-data-step';
import { SalaryDataStep } from './salary-data-step';
import { BenefitsDataStep } from './benefits-data-step';
import { EmployeeFormData, initialFormData, WIZARD_STEPS } from './types';

interface EmployeeWizardProps {
  onBack: () => void;
  onSave: (data: EmployeeFormData) => void;
  onCalculate: (data: EmployeeFormData) => void;
}

export function EmployeeWizard({ onBack, onSave, onCalculate }: EmployeeWizardProps) {
  const { addEmployee } = useEmployeeStorage();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<EmployeeFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;

  // Input Handler
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Fehler löschen
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Navigation
  const goToStep = (step: number) => {
    if (step >= 0 && step < WIZARD_STEPS.length) {
      setCurrentStep(step);
    }
  };

  const goNext = () => {
    if (!isLastStep) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goBack = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Berechnen
  const handleCalculate = () => {
    onCalculate(formData);
  };

  // Speichern
  const handleSave = () => {
    const result = validateEmployeeForm(formData);
    
    if (!result.success) {
      const validationErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        validationErrors[path] = issue.message;
      }
      setErrors(validationErrors);
      
      // Zum ersten Fehler-Step springen
      const errorFields = Object.keys(validationErrors);
      const personalFields = ['firstName', 'lastName', 'street', 'houseNumber', 'postalCode', 'city', 'taxId', 'healthInsurance'];
      const employmentFields = ['startDate', 'department', 'position'];
      const salaryFields = ['grossSalary'];
      
      if (errorFields.some(f => personalFields.includes(f))) {
        setCurrentStep(0);
      } else if (errorFields.some(f => employmentFields.includes(f))) {
        setCurrentStep(1);
      } else if (errorFields.some(f => salaryFields.includes(f))) {
        setCurrentStep(2);
      }
      
      toast({
        title: 'Validierungsfehler',
        description: 'Bitte prüfen Sie die markierten Felder.',
        variant: 'destructive'
      });
      return;
    }
    
    setErrors({});
    onSave(formData);
    
    toast({
      title: 'Mitarbeiter gespeichert',
      description: `${formData.firstName} ${formData.lastName} wurde erfolgreich angelegt.`,
    });
  };

  // Step Props
  const stepProps = {
    formData,
    errors,
    onInputChange: handleInputChange,
  };

  // Render aktuellen Step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return <PersonalDataStep {...stepProps} />;
      case 1:
        return <EmploymentDataStep {...stepProps} />;
      case 2:
        return <SalaryDataStep {...stepProps} />;
      case 3:
        return <BenefitsDataStep {...stepProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Neuen Mitarbeiter hinzufügen"
        description="Erfassen Sie alle relevanten Daten für die Lohnabrechnung"
      >
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Button>
          <Button 
            onClick={handleCalculate}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Calculator className="h-4 w-4" />
            Berechnen
          </Button>
          {isLastStep && (
            <Button 
              onClick={handleSave}
              className="flex items-center gap-2 bg-gradient-primary hover:opacity-90"
            >
              <Save className="h-4 w-4" />
              Speichern
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Progress Indicator */}
      <div className="bg-card rounded-lg p-6 shadow-card">
        <WizardProgress 
          currentStep={currentStep} 
          onStepClick={goToStep} 
        />
      </div>

      {/* Step Content */}
      <div className="transition-all duration-300">
        {renderCurrentStep()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-4">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={isFirstStep}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Button>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          Schritt {currentStep + 1} von {WIZARD_STEPS.length}
        </div>

        {isLastStep ? (
          <Button
            onClick={handleSave}
            className="flex items-center gap-2 bg-gradient-primary hover:opacity-90"
          >
            <Check className="h-4 w-4" />
            Speichern
          </Button>
        ) : (
          <Button
            onClick={goNext}
            className="flex items-center gap-2"
          >
            Weiter
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
