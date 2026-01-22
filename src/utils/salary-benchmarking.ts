// Gehalts-Benchmarking und Insights 2025
// Branchen-Vergleich, regionale Kaufkraft, Karriere-Tracking

export type Industry = 
  | 'it_software'
  | 'finance'
  | 'healthcare'
  | 'manufacturing'
  | 'retail'
  | 'construction'
  | 'hospitality'
  | 'education'
  | 'public_service'
  | 'consulting';

export type Region = 
  | 'munich'
  | 'frankfurt'
  | 'berlin'
  | 'hamburg'
  | 'cologne'
  | 'stuttgart'
  | 'dusseldorf'
  | 'leipzig'
  | 'dresden'
  | 'rural';

export type ExperienceLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'executive';

export interface BenchmarkParams {
  grossMonthly: number;
  industry: Industry;
  region: Region;
  experienceLevel: ExperienceLevel;
  yearsOfExperience: number;
  hasLeadershipRole: boolean;
  teamSize?: number;
}

export interface BenchmarkResult {
  yourSalary: number;
  
  // Perzentil-Ranking
  percentileRank: number;
  percentileMessage: string;
  
  // Branchen-Vergleich
  industryMedian: number;
  industryAverage: number;
  industry25thPercentile: number;
  industry75thPercentile: number;
  industryTop10Percent: number;
  
  // Regionale Kaufkraft
  purchasingPower: {
    localIndex: number;
    adjustedSalary: number;
    comparisonCity: string;
    comparisonSalary: number;
  };
  
  // Potenzial
  salaryPotential: {
    currentLevel: string;
    nextLevel: string;
    nextLevelMedian: number;
    potentialIncrease: number;
  };
  
  insights: string[];
}

export interface CareerProgressEntry {
  date: Date;
  grossMonthly: number;
  industry: Industry;
  position: string;
  notes?: string;
}

export interface CareerProgressAnalysis {
  entries: CareerProgressEntry[];
  totalGrowth: number;
  averageAnnualGrowth: number;
  inflationAdjustedGrowth: number;
  milestones: string[];
}

// Gehaltsmediane nach Branche (2025, Deutschland)
const INDUSTRY_SALARIES: Record<Industry, { 
  median: number; 
  p25: number; 
  p75: number; 
  top10: number;
  growth: number; // Durchschnittliches Jahreswachstum
}> = {
  it_software: { median: 5800, p25: 4500, p75: 7500, top10: 9500, growth: 4.5 },
  finance: { median: 5500, p25: 4200, p75: 7200, top10: 10000, growth: 3.5 },
  healthcare: { median: 4200, p25: 3500, p75: 5500, top10: 7000, growth: 2.8 },
  manufacturing: { median: 4500, p25: 3600, p75: 5800, top10: 7500, growth: 2.5 },
  retail: { median: 3200, p25: 2600, p75: 4200, top10: 5500, growth: 2.0 },
  construction: { median: 4000, p25: 3200, p75: 5200, top10: 6800, growth: 3.0 },
  hospitality: { median: 2800, p25: 2400, p75: 3600, top10: 4800, growth: 2.2 },
  education: { median: 4000, p25: 3400, p75: 5000, top10: 6000, growth: 2.0 },
  public_service: { median: 4200, p25: 3500, p75: 5200, top10: 6500, growth: 2.0 },
  consulting: { median: 5500, p25: 4000, p75: 7500, top10: 12000, growth: 5.0 },
};

// Regionale Kaufkraft-Indizes (100 = Bundesdurchschnitt)
const REGIONAL_INDICES: Record<Region, { 
  costOfLiving: number; 
  name: string;
}> = {
  munich: { costOfLiving: 128, name: 'München' },
  frankfurt: { costOfLiving: 118, name: 'Frankfurt' },
  stuttgart: { costOfLiving: 115, name: 'Stuttgart' },
  berlin: { costOfLiving: 108, name: 'Berlin' },
  hamburg: { costOfLiving: 112, name: 'Hamburg' },
  cologne: { costOfLiving: 106, name: 'Köln' },
  dusseldorf: { costOfLiving: 108, name: 'Düsseldorf' },
  leipzig: { costOfLiving: 92, name: 'Leipzig' },
  dresden: { costOfLiving: 90, name: 'Dresden' },
  rural: { costOfLiving: 85, name: 'Ländlicher Raum' },
};

// Erfahrungsstufen-Multiplikatoren
const EXPERIENCE_MULTIPLIERS: Record<ExperienceLevel, number> = {
  junior: 0.75,
  mid: 1.0,
  senior: 1.25,
  lead: 1.50,
  executive: 2.0,
};

const EXPERIENCE_LEVEL_NAMES: Record<ExperienceLevel, string> = {
  junior: 'Junior (0-2 Jahre)',
  mid: 'Mid-Level (3-5 Jahre)',
  senior: 'Senior (6-10 Jahre)',
  lead: 'Lead/Manager (10+ Jahre)',
  executive: 'Executive/Director',
};

/**
 * Berechnet Perzentil-Ranking
 */
export function calculatePercentileRank(
  salary: number,
  industryData: { median: number; p25: number; p75: number; top10: number }
): number {
  const { p25, median, p75, top10 } = industryData;
  
  if (salary <= p25) {
    return (salary / p25) * 25;
  } else if (salary <= median) {
    return 25 + ((salary - p25) / (median - p25)) * 25;
  } else if (salary <= p75) {
    return 50 + ((salary - median) / (p75 - median)) * 25;
  } else if (salary <= top10) {
    return 75 + ((salary - p75) / (top10 - p75)) * 15;
  } else {
    return Math.min(99, 90 + ((salary - top10) / top10) * 10);
  }
}

/**
 * Berechnet Kaufkraft-adjustiertes Gehalt
 */
export function calculatePurchasingPower(
  salary: number,
  region: Region
): {
  localIndex: number;
  adjustedSalary: number;
  comparisonCity: string;
  comparisonSalary: number;
} {
  const localIndex = REGIONAL_INDICES[region].costOfLiving;
  
  // Kaufkraftbereinigtes Gehalt (auf Bundesdurchschnitt normiert)
  const adjustedSalary = (salary / localIndex) * 100;
  
  // Vergleich mit Leipzig (günstige Stadt)
  const leipzigIndex = REGIONAL_INDICES.leipzig.costOfLiving;
  const comparisonSalary = adjustedSalary * (leipzigIndex / 100);
  
  return {
    localIndex,
    adjustedSalary,
    comparisonCity: 'Leipzig',
    comparisonSalary,
  };
}

/**
 * Ermittelt nächste Karrierestufe und Gehaltspotenzial
 */
export function calculateSalaryPotential(
  currentSalary: number,
  experienceLevel: ExperienceLevel,
  industry: Industry
): {
  currentLevel: string;
  nextLevel: string;
  nextLevelMedian: number;
  potentialIncrease: number;
} {
  const levels: ExperienceLevel[] = ['junior', 'mid', 'senior', 'lead', 'executive'];
  const currentIndex = levels.indexOf(experienceLevel);
  const nextLevel = currentIndex < levels.length - 1 ? levels[currentIndex + 1] : experienceLevel;
  
  const industryMedian = INDUSTRY_SALARIES[industry].median;
  const nextLevelMedian = industryMedian * EXPERIENCE_MULTIPLIERS[nextLevel];
  const potentialIncrease = nextLevelMedian - currentSalary;
  
  return {
    currentLevel: EXPERIENCE_LEVEL_NAMES[experienceLevel],
    nextLevel: EXPERIENCE_LEVEL_NAMES[nextLevel],
    nextLevelMedian,
    potentialIncrease: Math.max(0, potentialIncrease),
  };
}

/**
 * Hauptfunktion: Vollständiges Benchmarking
 */
export function calculateBenchmark(params: BenchmarkParams): BenchmarkResult {
  const {
    grossMonthly,
    industry,
    region,
    experienceLevel,
    yearsOfExperience,
    hasLeadershipRole,
  } = params;
  
  const industryData = INDUSTRY_SALARIES[industry];
  
  // Perzentil-Ranking
  const percentileRank = calculatePercentileRank(grossMonthly, industryData);
  
  let percentileMessage = '';
  if (percentileRank >= 90) {
    percentileMessage = 'Exzellent! Sie gehören zu den Top 10% in Ihrer Branche.';
  } else if (percentileRank >= 75) {
    percentileMessage = 'Überdurchschnittlich! Sie verdienen mehr als 75% in Ihrer Branche.';
  } else if (percentileRank >= 50) {
    percentileMessage = 'Solide! Sie liegen über dem Branchenmedian.';
  } else if (percentileRank >= 25) {
    percentileMessage = 'Unter dem Median. Es gibt Potenzial nach oben.';
  } else {
    percentileMessage = 'Deutlich unter Branchendurchschnitt. Eine Gehaltsverhandlung könnte sich lohnen.';
  }
  
  // Kaufkraft
  const purchasingPower = calculatePurchasingPower(grossMonthly, region);
  
  // Potenzial
  const salaryPotential = calculateSalaryPotential(grossMonthly, experienceLevel, industry);
  
  // Insights generieren
  const insights: string[] = [];
  
  // Vergleich mit Erfahrung
  const expectedForExperience = industryData.median * EXPERIENCE_MULTIPLIERS[experienceLevel];
  if (grossMonthly < expectedForExperience * 0.9) {
    insights.push(`📊 Für Ihre Erfahrungsstufe wäre ein Gehalt von ${formatCurrency(expectedForExperience)} üblich.`);
  }
  
  // Leadership-Bonus
  if (hasLeadershipRole && percentileRank < 75) {
    insights.push(`👔 Mit Führungsverantwortung liegt das übliche Gehalt ca. 15-25% höher.`);
  }
  
  // Regionaler Vergleich
  if (purchasingPower.localIndex > 110) {
    insights.push(`🏙️ In ${REGIONAL_INDICES[region].name} sind die Lebenshaltungskosten ${purchasingPower.localIndex - 100}% über dem Durchschnitt.`);
  } else if (purchasingPower.localIndex < 95) {
    insights.push(`💰 Ihre Kaufkraft ist überdurchschnittlich! In ${REGIONAL_INDICES[region].name} kommen Sie mit Ihrem Gehalt weiter.`);
  }
  
  // Branchen-Wachstum
  if (industryData.growth > 4) {
    insights.push(`📈 Ihre Branche wächst überdurchschnittlich (~${industryData.growth}%/Jahr). Gute Verhandlungsposition!`);
  }
  
  // Nächster Karriereschritt
  if (salaryPotential.potentialIncrease > 500) {
    insights.push(`🚀 Nächste Stufe (${salaryPotential.nextLevel}): +${formatCurrency(salaryPotential.potentialIncrease)}/Monat möglich.`);
  }
  
  return {
    yourSalary: grossMonthly,
    percentileRank: Math.round(percentileRank),
    percentileMessage,
    
    industryMedian: industryData.median,
    industryAverage: industryData.median * 1.05, // Durchschnitt leicht über Median
    industry25thPercentile: industryData.p25,
    industry75thPercentile: industryData.p75,
    industryTop10Percent: industryData.top10,
    
    purchasingPower,
    salaryPotential,
    insights,
  };
}

/**
 * Analysiert Karriere-Fortschritt über Zeit
 */
export function analyzeCareerProgress(entries: CareerProgressEntry[]): CareerProgressAnalysis {
  if (entries.length < 2) {
    return {
      entries,
      totalGrowth: 0,
      averageAnnualGrowth: 0,
      inflationAdjustedGrowth: 0,
      milestones: ['Fügen Sie mehr Einträge hinzu, um Ihren Fortschritt zu analysieren.'],
    };
  }
  
  const sortedEntries = [...entries].sort((a, b) => a.date.getTime() - b.date.getTime());
  const firstEntry = sortedEntries[0];
  const lastEntry = sortedEntries[sortedEntries.length - 1];
  
  const totalGrowth = ((lastEntry.grossMonthly - firstEntry.grossMonthly) / firstEntry.grossMonthly) * 100;
  
  const yearsDiff = (lastEntry.date.getTime() - firstEntry.date.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  const averageAnnualGrowth = yearsDiff > 0 ? totalGrowth / yearsDiff : 0;
  
  // Inflationsbereinigung (ca. 2.5% p.a.)
  const inflationRate = 2.5;
  const inflationAdjustedGrowth = averageAnnualGrowth - inflationRate;
  
  const milestones: string[] = [];
  
  // Meilensteine finden
  let previousSalary = firstEntry.grossMonthly;
  sortedEntries.forEach((entry, index) => {
    if (index === 0) return;
    
    const increase = ((entry.grossMonthly - previousSalary) / previousSalary) * 100;
    if (increase >= 10) {
      milestones.push(`🎉 ${entry.date.toLocaleDateString('de-DE')}: +${increase.toFixed(0)}% Gehaltssprung${entry.notes ? ` (${entry.notes})` : ''}`);
    }
    previousSalary = entry.grossMonthly;
  });
  
  // Bewertung des Wachstums
  if (averageAnnualGrowth >= 5) {
    milestones.push('📈 Überdurchschnittliche Gehaltsentwicklung!');
  } else if (averageAnnualGrowth >= 3) {
    milestones.push('📊 Solide Gehaltsentwicklung im Branchentrend.');
  } else if (averageAnnualGrowth < inflationRate) {
    milestones.push('⚠️ Gehaltswachstum unter Inflation. Verhandlung empfohlen.');
  }
  
  return {
    entries: sortedEntries,
    totalGrowth,
    averageAnnualGrowth,
    inflationAdjustedGrowth,
    milestones,
  };
}

/**
 * Generiert Gehaltsempfehlung für Verhandlung
 */
export function generateNegotiationRecommendation(
  currentSalary: number,
  benchmarkResult: BenchmarkResult
): {
  recommendedRange: { min: number; max: number };
  targetSalary: number;
  arguments: string[];
} {
  const { percentileRank, industryMedian, industry75thPercentile } = benchmarkResult;
  
  let minIncrease = 0.03; // Mindestens 3%
  let maxIncrease = 0.15; // Max 15%
  
  if (percentileRank < 25) {
    minIncrease = 0.10;
    maxIncrease = 0.25;
  } else if (percentileRank < 50) {
    minIncrease = 0.05;
    maxIncrease = 0.15;
  }
  
  const targetSalary = Math.min(
    currentSalary * (1 + (minIncrease + maxIncrease) / 2),
    industry75thPercentile
  );
  
  const arguments_list: string[] = [
    `Marktüblich für Ihre Position: ${formatCurrency(industryMedian)}`,
  ];
  
  if (percentileRank < 50) {
    arguments_list.push(`Ihr aktuelles Gehalt liegt unter dem Branchenmedian.`);
  }
  
  if (benchmarkResult.purchasingPower.localIndex > 105) {
    arguments_list.push(`Lebenshaltungskosten am Standort überdurchschnittlich hoch.`);
  }
  
  return {
    recommendedRange: {
      min: Math.round(currentSalary * (1 + minIncrease)),
      max: Math.round(currentSalary * (1 + maxIncrease)),
    },
    targetSalary: Math.round(targetSalary),
    arguments: arguments_list,
  };
}

// Hilfsfunktion
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

// Export der Konstanten für UI
export const INDUSTRY_NAMES: Record<Industry, string> = {
  it_software: 'IT & Software',
  finance: 'Finanzwesen',
  healthcare: 'Gesundheitswesen',
  manufacturing: 'Produktion & Industrie',
  retail: 'Einzelhandel',
  construction: 'Bauwesen',
  hospitality: 'Gastronomie & Hotellerie',
  education: 'Bildung',
  public_service: 'Öffentlicher Dienst',
  consulting: 'Beratung',
};

export const REGION_NAMES: Record<Region, string> = {
  munich: 'München',
  frankfurt: 'Frankfurt am Main',
  berlin: 'Berlin',
  hamburg: 'Hamburg',
  cologne: 'Köln',
  stuttgart: 'Stuttgart',
  dusseldorf: 'Düsseldorf',
  leipzig: 'Leipzig',
  dresden: 'Dresden',
  rural: 'Ländlicher Raum',
};

// Kompatibilität mit Payroll Guardian
export interface SimpleBenchmarkParams {
  position: string;
  industry: string;
  region: string;
  experience: number;
  education: string;
}

export interface SimpleBenchmarkResult {
  percentile: number;
  medianSalary: number;
  delta: number;
}

/**
 * Vereinfachte Benchmarking-Funktion für Payroll Guardian
 */
export function getSalaryBenchmark(params: SimpleBenchmarkParams): SimpleBenchmarkResult {
  // Map position zu Experience Level
  const positionLower = params.position.toLowerCase();
  let experienceLevel: ExperienceLevel = 'mid';
  
  if (positionLower.includes('junior') || positionLower.includes('trainee') || positionLower.includes('azubi')) {
    experienceLevel = 'junior';
  } else if (positionLower.includes('senior') || positionLower.includes('specialist')) {
    experienceLevel = 'senior';
  } else if (positionLower.includes('lead') || positionLower.includes('manager') || positionLower.includes('leiter')) {
    experienceLevel = 'lead';
  } else if (positionLower.includes('director') || positionLower.includes('head') || positionLower.includes('chief')) {
    experienceLevel = 'executive';
  }

  // Map industry string zu Industry type
  const industryLower = params.industry.toLowerCase();
  let industry: Industry = 'manufacturing';
  
  if (industryLower.includes('it') || industryLower.includes('software') || industryLower.includes('tech')) {
    industry = 'it_software';
  } else if (industryLower.includes('finanz') || industryLower.includes('bank') || industryLower.includes('buchhalt')) {
    industry = 'finance';
  } else if (industryLower.includes('gesund') || industryLower.includes('pflege') || industryLower.includes('health')) {
    industry = 'healthcare';
  } else if (industryLower.includes('handel') || industryLower.includes('retail') || industryLower.includes('verkauf')) {
    industry = 'retail';
  } else if (industryLower.includes('bau') || industryLower.includes('construct')) {
    industry = 'construction';
  } else if (industryLower.includes('gastro') || industryLower.includes('hotel')) {
    industry = 'hospitality';
  } else if (industryLower.includes('bildung') || industryLower.includes('education') || industryLower.includes('schule')) {
    industry = 'education';
  } else if (industryLower.includes('öffentlich') || industryLower.includes('public') || industryLower.includes('staat')) {
    industry = 'public_service';
  } else if (industryLower.includes('berat') || industryLower.includes('consult')) {
    industry = 'consulting';
  }

  // Map region zu Region type
  const regionLower = params.region.toLowerCase();
  let region: Region = 'rural';
  
  if (regionLower.includes('münchen') || regionLower.includes('munich') || regionLower.includes('bayern')) {
    region = 'munich';
  } else if (regionLower.includes('frankfurt') || regionLower.includes('hessen')) {
    region = 'frankfurt';
  } else if (regionLower.includes('berlin')) {
    region = 'berlin';
  } else if (regionLower.includes('hamburg')) {
    region = 'hamburg';
  } else if (regionLower.includes('köln') || regionLower.includes('cologne')) {
    region = 'cologne';
  } else if (regionLower.includes('stuttgart') || regionLower.includes('baden')) {
    region = 'stuttgart';
  } else if (regionLower.includes('düsseldorf') || regionLower.includes('nordrhein')) {
    region = 'dusseldorf';
  } else if (regionLower.includes('leipzig') || regionLower.includes('sachsen')) {
    region = 'leipzig';
  } else if (regionLower.includes('dresden')) {
    region = 'dresden';
  }

  const industryData = INDUSTRY_SALARIES[industry];
  const medianSalary = industryData.median * EXPERIENCE_MULTIPLIERS[experienceLevel] * 12;
  
  // Für jetzt simulieren wir ein Percentil basierend auf Erfahrung
  const experienceYears = params.experience;
  let percentile = 50;
  
  if (experienceYears >= 15) percentile = 80;
  else if (experienceYears >= 10) percentile = 70;
  else if (experienceYears >= 5) percentile = 55;
  else if (experienceYears >= 2) percentile = 40;
  else percentile = 25;

  return {
    percentile,
    medianSalary,
    delta: 0 // Wird vom Caller berechnet
  };
}
