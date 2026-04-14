/**
 * Supabase-basierter Mitarbeiter-Hook – React Query Version
 */
import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/tenant-context';
import { Employee, TaxClass, EmploymentType } from '@/types/employee';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { queryKeys } from '@/lib/query-keys';

type DbEmployee = Tables<'employees'>;

// ============= Mapper: DB → App =============

function dbToEmployee(row: DbEmployee): Employee {
  return {
    id: row.id,
    personalData: {
      firstName: row.first_name,
      lastName: row.last_name,
      dateOfBirth: row.date_of_birth ? new Date(row.date_of_birth) : new Date(),
      address: {
        street: row.street ?? '',
        houseNumber: '',
        postalCode: row.zip_code ?? '',
        city: row.city ?? '',
        state: '',
        country: 'DE',
      },
      taxId: row.tax_id ?? '',
      taxClass: taxClassFromNumber(row.tax_class),
      churchTax: row.church_tax ?? false,
      healthInsurance: {
        name: row.health_insurance ?? '',
        additionalRate: 0,
      },
      socialSecurityNumber: row.sv_number ?? '',
      childAllowances: Number(row.children_allowance ?? 0),
      relationshipStatus: 'single',
    },
    employmentData: {
      employmentType: (row.employment_type as EmploymentType) ?? 'fulltime',
      startDate: row.entry_date ? new Date(row.entry_date) : new Date(),
      endDate: row.exit_date ? new Date(row.exit_date) : undefined,
      isFixedTerm: false,
      weeklyHours: Number(row.weekly_hours ?? 40),
      vacationDays: 30,
      workDays: [],
      department: row.department ?? '',
      position: row.position ?? '',
      contractSigned: true,
      dataRetentionDate: new Date(new Date().getFullYear() + 10, 0, 1),
    },
    salaryData: {
      grossSalary: Number(row.gross_salary),
      salaryType: 'fixed',
      additionalBenefits: {
        companyCar: row.has_company_car ? Number(row.company_car_list_price ?? 0) : undefined,
        companyPension: row.has_bav ? Number(row.bav_monthly_amount ?? 0) : undefined,
      },
      bankingData: {
        iban: row.iban ?? '',
        bic: row.bic ?? '',
        bankName: '',
        accountHolder: `${row.first_name} ${row.last_name}`,
      },
    },
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function taxClassFromNumber(tc: number | null): TaxClass {
  const map: Record<number, TaxClass> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI' };
  return map[tc ?? 1] ?? 'I';
}

function taxClassToNumber(tc: TaxClass): number {
  const map: Record<TaxClass, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6 };
  return map[tc];
}

// ============= Mapper: App → DB =============

function employeeToInsert(emp: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): TablesInsert<'employees'> {
  return {
    first_name: emp.personalData.firstName,
    last_name: emp.personalData.lastName,
    date_of_birth: emp.personalData.dateOfBirth.toISOString().split('T')[0],
    street: emp.personalData.address.street,
    zip_code: emp.personalData.address.postalCode,
    city: emp.personalData.address.city,
    tax_id: emp.personalData.taxId,
    tax_class: taxClassToNumber(emp.personalData.taxClass),
    church_tax: emp.personalData.churchTax,
    church_tax_rate: emp.personalData.churchTax ? 9 : 0,
    sv_number: emp.personalData.socialSecurityNumber,
    health_insurance: emp.personalData.healthInsurance.name,
    children_allowance: emp.personalData.childAllowances,
    gross_salary: emp.salaryData.grossSalary,
    employment_type: emp.employmentData.employmentType,
    weekly_hours: emp.employmentData.weeklyHours,
    entry_date: emp.employmentData.startDate.toISOString().split('T')[0],
    exit_date: emp.employmentData.endDate?.toISOString().split('T')[0] ?? null,
    department: emp.employmentData.department,
    position: emp.employmentData.position,
    iban: emp.salaryData.bankingData.iban,
    bic: emp.salaryData.bankingData.bic,
    has_bav: (emp.salaryData.additionalBenefits.companyPension ?? 0) > 0,
    bav_monthly_amount: emp.salaryData.additionalBenefits.companyPension ?? 0,
    has_company_car: (emp.salaryData.additionalBenefits.companyCar ?? 0) > 0,
    company_car_list_price: emp.salaryData.additionalBenefits.companyCar ?? 0,
    is_active: true,
  };
}

function employeeToUpdate(updates: Partial<Employee>): TablesUpdate<'employees'> {
  const result: TablesUpdate<'employees'> = {};
  
  if (updates.personalData) {
    const p = updates.personalData;
    if (p.firstName) result.first_name = p.firstName;
    if (p.lastName) result.last_name = p.lastName;
    if (p.dateOfBirth) result.date_of_birth = p.dateOfBirth.toISOString().split('T')[0];
    if (p.address) {
      result.street = p.address.street;
      result.zip_code = p.address.postalCode;
      result.city = p.address.city;
    }
    if (p.taxId !== undefined) result.tax_id = p.taxId;
    if (p.taxClass) result.tax_class = taxClassToNumber(p.taxClass);
    if (p.churchTax !== undefined) result.church_tax = p.churchTax;
    if (p.socialSecurityNumber !== undefined) result.sv_number = p.socialSecurityNumber;
    if (p.childAllowances !== undefined) result.children_allowance = p.childAllowances;
    if (p.healthInsurance) result.health_insurance = p.healthInsurance.name;
  }
  
  if (updates.employmentData) {
    const e = updates.employmentData;
    if (e.employmentType) result.employment_type = e.employmentType;
    if (e.weeklyHours !== undefined) result.weekly_hours = e.weeklyHours;
    if (e.startDate) result.entry_date = e.startDate.toISOString().split('T')[0];
    if (e.department) result.department = e.department;
    if (e.position) result.position = e.position;
  }
  
  if (updates.salaryData) {
    const s = updates.salaryData;
    if (s.grossSalary !== undefined) result.gross_salary = s.grossSalary;
    if (s.bankingData) {
      result.iban = s.bankingData.iban;
      result.bic = s.bankingData.bic;
    }
  }
  
  return result;
}

// ============= Fetch function =============

async function fetchEmployees(tenantId: string | null): Promise<Employee[]> {
  if (!tenantId) return [];
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('last_name');
  
  if (error) throw new Error(error.message);
  return (data ?? []).map(dbToEmployee);
}

// ============= Hook =============

export function useSupabaseEmployees() {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  const queryKey = queryKeys.employees.all(tenantId);

  const { data: employees = [], isLoading, error: queryError } = useQuery({
    queryKey,
    queryFn: () => fetchEmployees(tenantId),
    enabled: !!tenantId,
    staleTime: 30_000,
  });

  const error = queryError?.message ?? null;

  const addMutation = useMutation({
    mutationFn: async (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
      const insert = { ...employeeToInsert(employeeData), tenant_id: tenantId };
      const { data, error: err } = await supabase
        .from('employees')
        .insert(insert)
        .select()
        .single();
      if (err) throw new Error(err.message);
      return dbToEmployee(data);
    },
    onSuccess: (newEmp) => {
      queryClient.setQueryData<Employee[]>(queryKey, (old = []) => [...old, newEmp]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Employee> }) => {
      const dbUpdates = employeeToUpdate(updates);
      const { error: err } = await supabase.from('employees').update(dbUpdates).eq('id', id);
      if (err) throw new Error(err.message);
      return { id, updates };
    },
    onSuccess: ({ id, updates }) => {
      queryClient.setQueryData<Employee[]>(queryKey, (old = []) =>
        old.map(emp => emp.id === id ? { ...emp, ...updates, updatedAt: new Date() } : emp)
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error: err } = await supabase.from('employees').delete().eq('id', id);
      if (err) throw new Error(err.message);
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<Employee[]>(queryKey, (old = []) => old.filter(emp => emp.id !== id));
    },
  });

  const addEmployee = useCallback(async (
    employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Employee | null> => {
    try {
      return await addMutation.mutateAsync(employeeData);
    } catch {
      return null;
    }
  }, [addMutation]);

  const updateEmployee = useCallback(async (id: string, updates: Partial<Employee>) => {
    try {
      await updateMutation.mutateAsync({ id, updates });
    } catch {
      // error handled by mutation
    }
  }, [updateMutation]);

  const deleteEmployee = useCallback(async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch {
      // error handled by mutation
    }
  }, [deleteMutation]);

  const getEmployee = useCallback((id: string): Employee | undefined => {
    return employees.find(emp => emp.id === id);
  }, [employees]);

  const refreshData = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return {
    employees,
    isLoading,
    error,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployee,
    refreshData,
  };
}
