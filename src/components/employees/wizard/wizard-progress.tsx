/**
 * Wizard Progress Indicator
 */

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WIZARD_STEPS, WizardStepId } from './types';

interface WizardProgressProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function WizardProgress({ currentStep, onStepClick }: WizardProgressProps) {
  return (
    <div className="w-full">
      {/* Desktop Progress */}
      <div className="hidden md:flex items-center justify-between">
        {WIZARD_STEPS.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <button
                onClick={() => onStepClick(index)}
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  isCompleted && 'bg-primary border-primary text-primary-foreground',
                  isCurrent && 'border-primary bg-primary/10 text-primary',
                  !isCompleted && !isCurrent && 'border-muted-foreground/30 text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="font-semibold">{index + 1}</span>
                )}
              </button>
              
              {/* Step Label */}
              <div className="ml-3 flex-shrink-0">
                <p className={cn(
                  'text-sm font-medium',
                  isCurrent && 'text-primary',
                  isCompleted && 'text-foreground',
                  !isCompleted && !isCurrent && 'text-muted-foreground'
                )}>
                  {step.label}
                </p>
              </div>
              
              {/* Connector Line */}
              {index < WIZARD_STEPS.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-4',
                  isCompleted ? 'bg-primary' : 'bg-muted-foreground/20'
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Progress */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          {WIZARD_STEPS.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <button
                key={step.id}
                onClick={() => onStepClick(index)}
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
                  isCompleted && 'bg-primary border-primary text-primary-foreground',
                  isCurrent && 'border-primary bg-primary/10 text-primary',
                  !isCompleted && !isCurrent && 'border-muted-foreground/30 text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="font-semibold">{index + 1}</span>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Current Step Label */}
        <p className="text-center text-sm font-medium text-primary">
          {WIZARD_STEPS[currentStep]?.label}
        </p>
      </div>
    </div>
  );
}
