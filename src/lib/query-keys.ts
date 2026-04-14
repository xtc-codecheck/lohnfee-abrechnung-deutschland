/**
 * React Query key factory for consistent cache management
 */
export const queryKeys = {
  employees: {
    all: (tenantId: string | null) => ['employees', tenantId] as const,
  },
  payroll: {
    periods: (tenantId: string | null) => ['payroll-periods', tenantId] as const,
    entries: (tenantId: string | null) => ['payroll-entries', tenantId] as const,
  },
  timeEntries: {
    all: (tenantId: string | null) => ['time-entries', tenantId] as const,
  },
  compliance: {
    alerts: (tenantId: string | null) => ['compliance-alerts', tenantId] as const,
  },
  specialPayments: {
    all: (tenantId: string | null) => ['special-payments', tenantId] as const,
  },
  contactMessages: {
    all: () => ['contact-messages'] as const,
  },
} as const;
