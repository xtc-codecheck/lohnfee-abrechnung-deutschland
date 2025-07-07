import { useState, useEffect } from 'react';
import { Employee } from '@/types/employee';

const STORAGE_KEY = 'lohnpro_employees';

export function useEmployeeStorage() {
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Load employees from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const employeesWithDates = parsed.map((emp: any) => ({
          ...emp,
          personalData: {
            ...emp.personalData,
            dateOfBirth: new Date(emp.personalData.dateOfBirth)
          },
          employmentData: {
            ...emp.employmentData,
            startDate: new Date(emp.employmentData.startDate),
            endDate: emp.employmentData.endDate ? new Date(emp.employmentData.endDate) : undefined
          },
          createdAt: new Date(emp.createdAt),
          updatedAt: new Date(emp.updatedAt)
        }));
        setEmployees(employeesWithDates);
      } catch (error) {
        console.error('Error loading employees from storage:', error);
      }
    }
  }, []);

  // Save employees to localStorage whenever the array changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
  }, [employees]);

  const addEmployee = (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEmployee: Employee = {
      ...employee,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setEmployees(prev => [...prev, newEmployee]);
    return newEmployee;
  };

  const updateEmployee = (id: string, updates: Partial<Omit<Employee, 'id' | 'createdAt'>>) => {
    setEmployees(prev => 
      prev.map(emp => 
        emp.id === id 
          ? { ...emp, ...updates, updatedAt: new Date() }
          : emp
      )
    );
  };

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id));
  };

  const getEmployee = (id: string) => {
    return employees.find(emp => emp.id === id);
  };

  return {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployee
  };
}