import {
  Clock, Gift, Calculator, FileText, Download,
} from 'lucide-react';

export interface MonthlyPayrollWizardProps {
  onBack: () => void;
  onComplete: () => void;
}

export interface StepStatus {
  completed: boolean;
  approved: boolean;
  warnings: string[];
  criticalWarnings: string[];
  autoChecked: boolean;
}

export const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
] as const;

export const WIZARD_STEPS = [
  { id: 'time', title: 'Zeiterfassung', icon: Clock, description: 'Arbeitszeiten prüfen und freigeben' },
  { id: 'bonuses', title: 'Sonderzahlungen', icon: Gift, description: 'Boni, Urlaubsgeld, Weihnachtsgeld' },
  { id: 'payroll', title: 'Abrechnung', icon: Calculator, description: 'Lohnabrechnung berechnen' },
  { id: 'reports', title: 'Meldungen', icon: FileText, description: 'SV-Meldungen und Lohnsteuer' },
  { id: 'export', title: 'Export & Freigabe', icon: Download, description: 'DATEV/GoBD-Export und Genehmigung' },
] as const;

export const newStepStatus = (): StepStatus => ({
  completed: false, approved: false, warnings: [], criticalWarnings: [], autoChecked: false,
});
