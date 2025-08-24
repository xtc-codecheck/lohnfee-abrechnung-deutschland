import { useState, useEffect } from 'react';
import { SickPayCalculation, MaternityBenefits, ShortTimeWork, SpecialPaymentSummary } from '@/types/special-payments';

const SICK_PAY_KEY = 'lohnpro_sick_pay';
const MATERNITY_KEY = 'lohnpro_maternity_benefits';
const SHORT_TIME_KEY = 'lohnpro_short_time_work';

export function useSpecialPayments() {
  const [sickPayments, setSickPayments] = useState<SickPayCalculation[]>([]);
  const [maternityBenefits, setMaternityBenefits] = useState<MaternityBenefits[]>([]);
  const [shortTimeWork, setShortTimeWork] = useState<ShortTimeWork[]>([]);

  // Lade Daten aus localStorage
  useEffect(() => {
    const loadData = (key: string) => {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.map((item: any) => ({
            ...item,
            startDate: new Date(item.startDate),
            endDate: new Date(item.endDate),
            createdAt: new Date(item.createdAt),
          }));
        } catch (error) {
          console.error(`Error loading ${key}:`, error);
          return [];
        }
      }
      return [];
    };

    setSickPayments(loadData(SICK_PAY_KEY));
    setMaternityBenefits(loadData(MATERNITY_KEY));
    setShortTimeWork(loadData(SHORT_TIME_KEY));
  }, []);

  // Speichere Daten in localStorage
  useEffect(() => {
    localStorage.setItem(SICK_PAY_KEY, JSON.stringify(sickPayments));
  }, [sickPayments]);

  useEffect(() => {
    localStorage.setItem(MATERNITY_KEY, JSON.stringify(maternityBenefits));
  }, [maternityBenefits]);

  useEffect(() => {
    localStorage.setItem(SHORT_TIME_KEY, JSON.stringify(shortTimeWork));
  }, [shortTimeWork]);

  // Krankengeld-Funktionen
  const addSickPayment = (payment: SickPayCalculation) => {
    setSickPayments(prev => [...prev, payment]);
  };

  const updateSickPayment = (id: string, updates: Partial<SickPayCalculation>) => {
    setSickPayments(prev => 
      prev.map(payment => 
        payment.id === id ? { ...payment, ...updates } : payment
      )
    );
  };

  const deleteSickPayment = (id: string) => {
    setSickPayments(prev => prev.filter(payment => payment.id !== id));
  };

  const getSickPaymentsForEmployee = (employeeId: string) => {
    return sickPayments.filter(payment => payment.employeeId === employeeId);
  };

  // Mutterschaftsleistungen-Funktionen
  const addMaternityBenefit = (benefit: MaternityBenefits) => {
    setMaternityBenefits(prev => [...prev, benefit]);
  };

  const updateMaternityBenefit = (id: string, updates: Partial<MaternityBenefits>) => {
    setMaternityBenefits(prev => 
      prev.map(benefit => 
        benefit.id === id ? { ...benefit, ...updates } : benefit
      )
    );
  };

  const deleteMaternityBenefit = (id: string) => {
    setMaternityBenefits(prev => prev.filter(benefit => benefit.id !== id));
  };

  const getMaternityBenefitsForEmployee = (employeeId: string) => {
    return maternityBenefits.filter(benefit => benefit.employeeId === employeeId);
  };

  // Kurzarbeit-Funktionen
  const addShortTimeWork = (work: ShortTimeWork) => {
    setShortTimeWork(prev => [...prev, work]);
  };

  const updateShortTimeWork = (id: string, updates: Partial<ShortTimeWork>) => {
    setShortTimeWork(prev => 
      prev.map(work => 
        work.id === id ? { ...work, ...updates } : work
      )
    );
  };

  const deleteShortTimeWork = (id: string) => {
    setShortTimeWork(prev => prev.filter(work => work.id !== id));
  };

  const getShortTimeWorkForEmployee = (employeeId: string) => {
    return shortTimeWork.filter(work => work.employeeId === employeeId);
  };

  // Zusammenfassung für einen Mitarbeiter in einem bestimmten Monat
  const getSpecialPaymentSummary = (employeeId: string, year: number, month: number): SpecialPaymentSummary => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const sickPayInPeriod = sickPayments
      .filter(payment => 
        payment.employeeId === employeeId &&
        payment.startDate <= endDate &&
        payment.endDate >= startDate
      )
      .reduce((sum, payment) => sum + payment.totalSickPay, 0);

    const maternityInPeriod = maternityBenefits
      .filter(benefit => 
        benefit.employeeId === employeeId &&
        benefit.startDate <= endDate &&
        benefit.endDate >= startDate
      )
      .reduce((sum, benefit) => sum + benefit.totalBenefit, 0);

    const shortTimeInPeriod = shortTimeWork
      .filter(work => 
        work.employeeId === employeeId &&
        work.startDate <= endDate &&
        work.endDate >= startDate
      )
      .reduce((sum, work) => sum + work.shortTimeWorkBenefit, 0);

    return {
      employeeId,
      month,
      year,
      sickPay: sickPayInPeriod,
      maternityBenefits: maternityInPeriod,
      shortTimeWorkBenefit: shortTimeInPeriod,
      totalSpecialPayments: sickPayInPeriod + maternityInPeriod + shortTimeInPeriod,
    };
  };

  return {
    // Daten
    sickPayments,
    maternityBenefits,
    shortTimeWork,
    
    // Krankengeld
    addSickPayment,
    updateSickPayment,
    deleteSickPayment,
    getSickPaymentsForEmployee,
    
    // Mutterschaftsleistungen
    addMaternityBenefit,
    updateMaternityBenefit,
    deleteMaternityBenefit,
    getMaternityBenefitsForEmployee,
    
    // Kurzarbeit
    addShortTimeWork,
    updateShortTimeWork,
    deleteShortTimeWork,
    getShortTimeWorkForEmployee,
    
    // Zusammenfassung
    getSpecialPaymentSummary,
  };
}