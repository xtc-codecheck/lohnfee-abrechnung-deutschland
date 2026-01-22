// Gehaltsprognose-Engine für Payroll Guardian

import { Employee } from '@/types/employee';
import { 
  SalaryForecast, 
  SalaryProjection, 
  CareerMilestone, 
  OptimizationSuggestion,
  MarketPosition,
  HistoricalPayrollData
} from '@/types/payroll-guardian';
import { getSalaryBenchmark } from '@/utils/salary-benchmarking';

// Branchenspezifische Gehaltssteigerungsraten (Durchschnitt p.a.)
const INDUSTRY_GROWTH_RATES: Record<string, number> = {
  'IT': 0.045,
  'Finance': 0.035,
  'Healthcare': 0.03,
  'Manufacturing': 0.025,
  'Retail': 0.02,
  'Construction': 0.028,
  'Hospitality': 0.015,
  'default': 0.025
};

// Karrieremeilensteine mit typischen Gehaltsauswirkungen
const CAREER_MILESTONES = {
  promotion: { min: 0.10, max: 0.20 },
  seniorRole: { min: 0.15, max: 0.30 },
  teamLead: { min: 0.20, max: 0.35 },
  manager: { min: 0.25, max: 0.50 },
  director: { min: 0.40, max: 0.80 }
};

/**
 * Generiert eine umfassende Gehaltsprognose
 */
export function generateSalaryForecast(
  employee: Employee,
  historicalData: HistoricalPayrollData[],
  yearsToProject: number = 10
): SalaryForecast {
  const currentSalary = employee.salaryData.grossSalary;
  const department = employee.employmentData.department;
  const position = employee.employmentData.position;

  // Branchenspezifische Wachstumsrate ermitteln
  const industryGrowthRate = getIndustryGrowthRate(department);
  
  // Historischen Trend analysieren
  const historicalTrend = analyzeHistoricalTrend(historicalData);
  
  // Projections generieren
  const projections = generateProjections(
    currentSalary,
    industryGrowthRate,
    historicalTrend,
    yearsToProject
  );

  // Karrieremeilensteine basierend auf Position prognostizieren
  const careerPath = predictCareerPath(employee, currentSalary);

  // Optimierungspotenziale identifizieren
  const optimizationPotential = identifyOptimizations(employee);

  // Marktvergleich
  const marketComparison = getMarketComparison(employee);

  return {
    employeeId: employee.id,
    employeeName: `${employee.personalData.firstName} ${employee.personalData.lastName}`,
    currentSalary,
    projections,
    careerPath,
    optimizationPotential,
    marketComparison
  };
}

/**
 * Ermittelt branchenspezifische Wachstumsrate
 */
function getIndustryGrowthRate(department: string): number {
  const normalizedDept = department.toLowerCase();
  
  if (normalizedDept.includes('it') || normalizedDept.includes('tech') || normalizedDept.includes('software')) {
    return INDUSTRY_GROWTH_RATES['IT'];
  }
  if (normalizedDept.includes('finanz') || normalizedDept.includes('buchhalt')) {
    return INDUSTRY_GROWTH_RATES['Finance'];
  }
  if (normalizedDept.includes('pflege') || normalizedDept.includes('gesund')) {
    return INDUSTRY_GROWTH_RATES['Healthcare'];
  }
  if (normalizedDept.includes('produktion') || normalizedDept.includes('fertigung')) {
    return INDUSTRY_GROWTH_RATES['Manufacturing'];
  }
  if (normalizedDept.includes('verkauf') || normalizedDept.includes('retail')) {
    return INDUSTRY_GROWTH_RATES['Retail'];
  }
  if (normalizedDept.includes('bau') || normalizedDept.includes('construct')) {
    return INDUSTRY_GROWTH_RATES['Construction'];
  }
  if (normalizedDept.includes('gastro') || normalizedDept.includes('hotel')) {
    return INDUSTRY_GROWTH_RATES['Hospitality'];
  }
  
  return INDUSTRY_GROWTH_RATES['default'];
}

/**
 * Analysiert historischen Gehaltstrend
 */
function analyzeHistoricalTrend(historicalData: HistoricalPayrollData[]): number {
  if (historicalData.length < 2) return 0;

  // Sortiere nach Periode
  const sorted = [...historicalData].sort((a, b) => a.period.localeCompare(b.period));
  
  // Berechne durchschnittliche monatliche Änderung
  let totalChange = 0;
  for (let i = 1; i < sorted.length; i++) {
    const change = (sorted[i].grossSalary - sorted[i-1].grossSalary) / sorted[i-1].grossSalary;
    totalChange += change;
  }
  
  // Annualisiere den monatlichen Durchschnitt
  const avgMonthlyChange = totalChange / (sorted.length - 1);
  return avgMonthlyChange * 12;
}

/**
 * Generiert Gehaltsprojektionen
 */
function generateProjections(
  currentSalary: number,
  industryGrowthRate: number,
  historicalTrend: number,
  years: number
): SalaryProjection[] {
  const projections: SalaryProjection[] = [];
  const currentYear = new Date().getFullYear();
  
  // Kombinierte Wachstumsrate (Gewichtung: 60% Industrie, 40% historisch)
  const baseGrowthRate = historicalTrend !== 0 
    ? industryGrowthRate * 0.6 + historicalTrend * 0.4
    : industryGrowthRate;

  // Inflationsanpassung (ca. 2% p.a.)
  const inflationRate = 0.02;

  for (let i = 1; i <= years; i++) {
    const year = currentYear + i;
    
    // Kompounding mit abnehmender Konfidenz
    const projectedSalary = currentSalary * Math.pow(1 + baseGrowthRate + inflationRate, i);
    
    // Netto-Schätzung (vereinfacht ~55-65% des Brutto)
    const netRatio = 0.60 - (projectedSalary / 200000) * 0.1; // Progressiv
    const projectedNet = projectedSalary * Math.max(0.50, netRatio);
    
    // Konfidenz nimmt mit der Zeit ab
    const confidence = Math.max(30, 95 - i * 6);

    const assumptions: string[] = [
      `Branchenwachstum: ${(industryGrowthRate * 100).toFixed(1)}% p.a.`,
      `Inflation: ${(inflationRate * 100).toFixed(1)}% p.a.`
    ];

    if (historicalTrend !== 0) {
      assumptions.push(`Historischer Trend: ${(historicalTrend * 100).toFixed(1)}% p.a.`);
    }

    projections.push({
      year,
      projectedSalary: Math.round(projectedSalary),
      projectedNet: Math.round(projectedNet),
      confidence,
      assumptions
    });
  }

  return projections;
}

/**
 * Prognostiziert Karrieremeilensteine
 */
function predictCareerPath(employee: Employee, currentSalary: number): CareerMilestone[] {
  const milestones: CareerMilestone[] = [];
  const currentYear = new Date().getFullYear();
  const position = employee.employmentData.position.toLowerCase();
  const yearsEmployed = Math.floor(
    (new Date().getTime() - new Date(employee.employmentData.startDate).getTime()) 
    / (1000 * 60 * 60 * 24 * 365)
  );

  // Basierend auf aktueller Position und Beschäftigungsdauer
  if (!position.includes('senior') && !position.includes('lead') && !position.includes('manager')) {
    // Junior -> Senior (typisch nach 3-5 Jahren)
    if (yearsEmployed < 3) {
      milestones.push({
        year: currentYear + (3 - yearsEmployed),
        event: 'Beförderung zum Senior',
        salaryImpact: currentSalary * 0.15,
        probability: 0.75
      });
    }
  }

  if (!position.includes('lead') && !position.includes('manager') && !position.includes('leiter')) {
    // Senior -> Team Lead (typisch nach 5-8 Jahren)
    milestones.push({
      year: currentYear + Math.max(2, 6 - yearsEmployed),
      event: 'Team Lead Position',
      salaryImpact: currentSalary * 0.25,
      probability: 0.50
    });
  }

  if (!position.includes('manager') && !position.includes('leiter') && !position.includes('director')) {
    // Team Lead -> Manager (typisch nach 8-12 Jahren)
    milestones.push({
      year: currentYear + Math.max(4, 10 - yearsEmployed),
      event: 'Management Position',
      salaryImpact: currentSalary * 0.35,
      probability: 0.35
    });
  }

  // Allgemeine Gehaltserhöhung
  milestones.push({
    year: currentYear + 1,
    event: 'Jährliche Gehaltsanpassung',
    salaryImpact: currentSalary * 0.03,
    probability: 0.90
  });

  return milestones.sort((a, b) => a.year - b.year);
}

/**
 * Identifiziert Optimierungspotenziale
 */
function identifyOptimizations(employee: Employee): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];
  const benefits = employee.salaryData.additionalBenefits;

  // Jobticket prüfen
  if (!benefits.taxFreeBenefits || benefits.taxFreeBenefits < 50) {
    suggestions.push({
      type: 'immediate',
      title: '50€ Sachbezug nutzen',
      description: 'Steuer- und SV-freier Sachbezug von bis zu 50€/Monat (z.B. Gutscheine, Tankkarte)',
      potentialSaving: 600,
      effort: 'low'
    });
  }

  // bAV prüfen
  if (!benefits.companyPension || benefits.companyPension < 100) {
    suggestions.push({
      type: 'short-term',
      title: 'Betriebliche Altersvorsorge',
      description: 'Durch Entgeltumwandlung Steuern und SV-Beiträge sparen, zusätzlich oft AG-Zuschuss',
      potentialSaving: 1200,
      effort: 'medium'
    });
  }

  // Dienstwagen prüfen (bei höherem Gehalt)
  if (employee.salaryData.grossSalary > 4000 && (!benefits.companyCar || benefits.companyCar === 0)) {
    suggestions.push({
      type: 'long-term',
      title: 'Dienstwagen-Option prüfen',
      description: 'Bei Vielfahrern kann ein E-Dienstwagen mit 0,25%-Regelung steuerlich vorteilhaft sein',
      potentialSaving: 2400,
      effort: 'high'
    });
  }

  // VL prüfen
  if (!benefits.capitalFormingBenefits || benefits.capitalFormingBenefits === 0) {
    suggestions.push({
      type: 'immediate',
      title: 'Vermögenswirksame Leistungen',
      description: 'Viele Arbeitgeber zahlen VL bis 40€/Monat - oft ungenutzt',
      potentialSaving: 480,
      effort: 'low'
    });
  }

  // Steuerklassenoptimierung bei Verheirateten
  if (employee.personalData.relationshipStatus === 'married') {
    const currentTaxClass = employee.personalData.taxClass;
    if (currentTaxClass === 'IV') {
      suggestions.push({
        type: 'immediate',
        title: 'Steuerklassenwechsel prüfen',
        description: 'Bei unterschiedlichen Einkommen kann III/V oder IV-Faktor günstiger sein',
        potentialSaving: 1800,
        effort: 'low'
      });
    }
  }

  return suggestions.sort((a, b) => b.potentialSaving - a.potentialSaving);
}

/**
 * Ermittelt Marktvergleich
 */
function getMarketComparison(employee: Employee): MarketPosition {
  const benchmark = getSalaryBenchmark({
    position: employee.employmentData.position,
    industry: employee.employmentData.department,
    region: employee.personalData.address.state || 'bayern',
    experience: calculateExperience(employee),
    education: 'bachelor' // Default, da nicht im Employee-Typ
  });

  const currentSalary = employee.salaryData.grossSalary * 12; // Jahresgehalt
  const percentile = benchmark.percentile;
  const medianSalary = benchmark.medianSalary;
  const delta = currentSalary - medianSalary;

  let recommendation: string;
  if (percentile >= 75) {
    recommendation = 'Überdurchschnittliches Gehalt. Fokus auf Zusatzleistungen und Karriereentwicklung.';
  } else if (percentile >= 50) {
    recommendation = 'Marktgerechtes Gehalt. Bei der nächsten Verhandlung 5-10% Steigerung anstreben.';
  } else if (percentile >= 25) {
    recommendation = 'Unter dem Durchschnitt. Gehaltsverhandlung mit konkreten Marktdaten empfohlen.';
  } else {
    recommendation = 'Deutlich unter Marktniveau. Dringend Gehaltsanpassung oder Stellenwechsel prüfen.';
  }

  return {
    percentile,
    medianSalary,
    delta,
    recommendation
  };
}

/**
 * Berechnet Berufserfahrung in Jahren
 */
function calculateExperience(employee: Employee): number {
  const startDate = new Date(employee.employmentData.startDate);
  const now = new Date();
  return Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
}

/**
 * Generiert Batch-Prognosen für mehrere Mitarbeiter
 */
export function generateBatchForecasts(
  employees: Employee[],
  historicalData: HistoricalPayrollData[],
  yearsToProject: number = 5
): SalaryForecast[] {
  return employees.map(employee => {
    const employeeHistory = historicalData.filter(h => h.employeeId === employee.id);
    return generateSalaryForecast(employee, employeeHistory, yearsToProject);
  });
}
