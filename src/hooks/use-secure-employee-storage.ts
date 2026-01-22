/**
 * Sicherer Mitarbeiter-Storage Hook
 * 
 * Ersetzt use-employee-storage.ts mit verschlüsselter Speicherung
 * für sensible Mitarbeiterdaten (Steuer-ID, IBAN, Gehalt etc.)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Employee } from '@/types/employee';
import { 
  SecureStorage, 
  getSecureStorage, 
  migrateToSecureStorage,
  SecureStorageResult 
} from '@/lib/secure-storage';

// ============= Konstanten =============

const STORAGE_KEY = 'employees';
const OLD_STORAGE_KEY = 'lohnpro_employees'; // Für Migration

// ============= Typen =============

export interface SecureEmployeeStorageState {
  employees: Employee[];
  isLoading: boolean;
  error: string | null;
  isEncrypted: boolean;
}

export interface SecureEmployeeStorageActions {
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Employee;
  updateEmployee: (id: string, updates: Partial<Omit<Employee, 'id' | 'createdAt'>>) => void;
  deleteEmployee: (id: string) => void;
  getEmployee: (id: string) => Employee | undefined;
  refreshData: () => void;
  exportData: () => SecureStorageResult<string>;
  importData: (encryptedData: string) => SecureStorageResult<number>;
}

// ============= Datums-Konvertierung =============

/**
 * Konvertiert Datum-Strings zurück in Date-Objekte
 */
function parseEmployeeDates(emp: any): Employee {
  return {
    ...emp,
    personalData: {
      ...emp.personalData,
      dateOfBirth: new Date(emp.personalData.dateOfBirth),
      relationshipDate: emp.personalData.relationshipDate 
        ? new Date(emp.personalData.relationshipDate) 
        : undefined,
    },
    employmentData: {
      ...emp.employmentData,
      startDate: new Date(emp.employmentData.startDate),
      endDate: emp.employmentData.endDate 
        ? new Date(emp.employmentData.endDate) 
        : undefined,
      contractSignedDate: emp.employmentData.contractSignedDate
        ? new Date(emp.employmentData.contractSignedDate)
        : undefined,
      dataRetentionDate: emp.employmentData.dataRetentionDate
        ? new Date(emp.employmentData.dataRetentionDate)
        : undefined,
    },
    createdAt: new Date(emp.createdAt),
    updatedAt: new Date(emp.updatedAt),
  };
}

// ============= Hook =============

/**
 * Hook für verschlüsselte Mitarbeiter-Speicherung
 * 
 * @example
 * ```typescript
 * const { employees, addEmployee, updateEmployee } = useSecureEmployeeStorage();
 * 
 * // Mitarbeiter hinzufügen (automatisch verschlüsselt)
 * const newEmployee = addEmployee({
 *   personalData: { taxId: '12345678901', ... },
 *   ...
 * });
 * ```
 */
export function useSecureEmployeeStorage(): SecureEmployeeStorageState & SecureEmployeeStorageActions {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // SecureStorage-Referenz (stabil über Re-Renders)
  const storageRef = useRef<SecureStorage | null>(null);
  
  // Initialisierung Flag
  const isInitializedRef = useRef(false);

  // SecureStorage initialisieren
  useEffect(() => {
    if (!storageRef.current) {
      storageRef.current = getSecureStorage();
    }
  }, []);

  // Daten laden (einmalig beim Mount)
  useEffect(() => {
    if (isInitializedRef.current) return;
    
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const storage = getSecureStorage();
        storageRef.current = storage;

        // Prüfen ob bereits verschlüsselte Daten existieren
        const secureResult = storage.getItem<Employee[]>(STORAGE_KEY);

        if (secureResult.success && secureResult.data) {
          // Verschlüsselte Daten gefunden
          const parsedEmployees = secureResult.data.map(parseEmployeeDates);
          setEmployees(parsedEmployees);
        } else {
          // Migration von alten unverschlüsselten Daten
          const migrationResult = migrateToSecureStorage<Employee[]>(
            OLD_STORAGE_KEY,
            STORAGE_KEY,
            storage,
            true // Alte Daten löschen
          );

          if (migrationResult.success && migrationResult.data) {
            const parsedEmployees = migrationResult.data.map(parseEmployeeDates);
            setEmployees(parsedEmployees);
            console.info('SecureStorage: Migration von unverschlüsselten Daten erfolgreich');
          } else if (!migrationResult.success && migrationResult.error) {
            // Nur loggen, kein Error-State - es könnten einfach keine Daten existieren
            console.info('SecureStorage: Keine bestehenden Daten gefunden');
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
        setError(errorMessage);
        console.error('SecureStorage: Fehler beim Laden', err);
      } finally {
        setIsLoading(false);
        isInitializedRef.current = true;
      }
    };

    loadData();
  }, []);

  // Speichern bei Änderungen (nach Initialisierung)
  useEffect(() => {
    if (!isInitializedRef.current || !storageRef.current) return;

    const saveResult = storageRef.current.setItem(STORAGE_KEY, employees);
    
    if (!saveResult.success) {
      console.error('SecureStorage: Fehler beim Speichern', saveResult.error);
      setError(saveResult.error ?? 'Speicherfehler');
    }
  }, [employees]);

  // ============= Actions =============

  const addEmployee = useCallback((
    employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>
  ): Employee => {
    const newEmployee: Employee = {
      ...employeeData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setEmployees(prev => [...prev, newEmployee]);
    return newEmployee;
  }, []);

  const updateEmployee = useCallback((
    id: string,
    updates: Partial<Omit<Employee, 'id' | 'createdAt'>>
  ): void => {
    setEmployees(prev =>
      prev.map(emp =>
        emp.id === id
          ? { ...emp, ...updates, updatedAt: new Date() }
          : emp
      )
    );
  }, []);

  const deleteEmployee = useCallback((id: string): void => {
    setEmployees(prev => prev.filter(emp => emp.id !== id));
  }, []);

  const getEmployee = useCallback((id: string): Employee | undefined => {
    return employees.find(emp => emp.id === id);
  }, [employees]);

  const refreshData = useCallback((): void => {
    if (!storageRef.current) return;

    const result = storageRef.current.getItem<Employee[]>(STORAGE_KEY);
    
    if (result.success && result.data) {
      const parsedEmployees = result.data.map(parseEmployeeDates);
      setEmployees(parsedEmployees);
      setError(null);
    } else if (!result.success) {
      setError(result.error ?? 'Fehler beim Aktualisieren');
    }
  }, []);

  const exportData = useCallback((): SecureStorageResult<string> => {
    if (!storageRef.current) {
      return { success: false, error: 'Storage nicht initialisiert' };
    }
    return storageRef.current.exportEncrypted();
  }, []);

  const importData = useCallback((encryptedData: string): SecureStorageResult<number> => {
    if (!storageRef.current) {
      return { success: false, error: 'Storage nicht initialisiert' };
    }
    
    const result = storageRef.current.importEncrypted(encryptedData);
    
    if (result.success) {
      refreshData();
    }
    
    return result;
  }, [refreshData]);

  return {
    // State
    employees,
    isLoading,
    error,
    isEncrypted: true,
    
    // Actions
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployee,
    refreshData,
    exportData,
    importData,
  };
}

// ============= Re-Export für Abwärtskompatibilität =============

/**
 * Alias für useSecureEmployeeStorage
 * Ermöglicht einfache Migration bestehender Imports
 */
export const useEmployeeStorage = useSecureEmployeeStorage;
