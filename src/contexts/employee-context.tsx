/**
 * Employee Context – zentraler Provider für Mitarbeiterdaten.
 * Verhindert doppelte Supabase-Queries, da alle Komponenten
 * dieselbe Instanz der Daten verwenden.
 */
import { createContext, useContext, ReactNode } from 'react';
import { useSupabaseEmployees } from '@/hooks/use-supabase-employees';
import { Employee } from '@/types/employee';

interface EmployeeContextType {
  employees: Employee[];
  isLoading: boolean;
  error: string | null;
  addEmployee: (data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Employee | null>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  getEmployee: (id: string) => Employee | undefined;
  refreshData: () => Promise<void>;
}

const EmployeeContext = createContext<EmployeeContextType | null>(null);

export function EmployeeProvider({ children }: { children: ReactNode }) {
  const employeeData = useSupabaseEmployees();

  return (
    <EmployeeContext.Provider value={employeeData}>
      {children}
    </EmployeeContext.Provider>
  );
}

export function useEmployees(): EmployeeContextType {
  const ctx = useContext(EmployeeContext);
  if (!ctx) {
    throw new Error('useEmployees must be used within an EmployeeProvider');
  }
  return ctx;
}
