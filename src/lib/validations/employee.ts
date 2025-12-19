import { z } from "zod";

// Basis-Validierungen
const nameSchema = z.string()
  .min(1, "Pflichtfeld")
  .max(100, "Maximal 100 Zeichen")
  .trim();

const postalCodeSchema = z.string()
  .regex(/^\d{5}$/, "Ungültige PLZ (5 Ziffern erwartet)");

const taxIdSchema = z.string()
  .regex(/^\d{11}$/, "Ungültige Steuer-ID (11 Ziffern erwartet)");

const socialSecurityNumberSchema = z.string()
  .regex(/^\d{12}$/, "Ungültige Sozialversicherungsnummer (12 Ziffern erwartet)")
  .optional()
  .or(z.literal(""));

const ibanSchema = z.string()
  .regex(/^DE\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{2}$/, "Ungültige IBAN")
  .optional()
  .or(z.literal(""));

const emailSchema = z.string()
  .email("Ungültige E-Mail-Adresse")
  .max(255, "Maximal 255 Zeichen")
  .optional()
  .or(z.literal(""));

const phoneSchema = z.string()
  .regex(/^[\d\s+\-()]*$/, "Ungültige Telefonnummer")
  .max(30, "Maximal 30 Zeichen")
  .optional()
  .or(z.literal(""));

// Haupt-Schemas
export const personalDataSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  gender: z.enum(["male", "female", "diverse"]),
  dateOfBirth: z.string().min(1, "Geburtsdatum ist erforderlich"),
  street: nameSchema,
  houseNumber: z.string().min(1, "Hausnummer ist erforderlich").max(10),
  postalCode: postalCodeSchema,
  city: nameSchema,
  state: z.string().min(1, "Bundesland ist erforderlich"),
  country: z.string().default("Deutschland"),
  phone: phoneSchema,
  email: emailSchema,
  taxId: taxIdSchema,
  taxClass: z.enum(["I", "II", "III", "IV", "V", "VI"]),
  religion: z.enum(["none", "catholic", "protestant", "old-catholic", "jewish", "free-religious", "unitarian", "mennonite", "huguenot", "other"]),
  relationshipStatus: z.enum(["single", "married", "divorced", "widowed"]),
  relationshipDate: z.string().optional(),
  healthInsurance: z.string().min(1, "Krankenkasse ist erforderlich"),
  healthInsuranceRate: z.number().min(0).max(10),
  socialSecurityNumber: socialSecurityNumberSchema,
  childAllowances: z.number().min(0).max(10),
});

export const employmentDataSchema = z.object({
  employmentType: z.enum(["minijob", "midijob", "fulltime", "parttime"]),
  department: z.string().max(100).optional(),
  position: z.string().max(100).optional(),
  startDate: z.string().min(1, "Eintrittsdatum ist erforderlich"),
  isFixedTerm: z.boolean(),
  endDate: z.string().optional(),
  weeklyHours: z.number().min(0).max(60),
  vacationDays: z.number().min(0).max(50),
  contractSigned: z.boolean(),
  contractSignedDate: z.string().optional(),
});

export const salaryDataSchema = z.object({
  grossSalary: z.number().min(0, "Bruttogehalt muss positiv sein"),
  hourlyWage: z.number().min(0).optional(),
  salaryType: z.enum(["fixed", "hourly", "variable"]),
});

export const additionalBenefitsSchema = z.object({
  carListPrice: z.number().min(0).optional(),
  carType: z.enum(["benzin", "elektro", "hybrid"]).optional(),
  benefits: z.number().min(0).optional(),
  travelExpenses: z.number().min(0).optional(),
  bonuses: z.number().min(0).optional(),
  allowances: z.number().min(0).optional(),
  companyPension: z.number().min(0).optional(),
  capitalFormingBenefits: z.number().min(0).optional(),
  taxFreeBenefits: z.number().min(0).optional(),
});

export const bankingDataSchema = z.object({
  iban: ibanSchema,
  bic: z.string().max(11).optional(),
  bankName: z.string().max(100).optional(),
  accountHolder: z.string().max(100).optional(),
});

// Kombiniertes Mitarbeiter-Schema
export const employeeFormSchema = z.object({
  ...personalDataSchema.shape,
  ...employmentDataSchema.shape,
  ...salaryDataSchema.shape,
  ...additionalBenefitsSchema.shape,
});

// Typen aus Schemas ableiten
export type PersonalDataInput = z.infer<typeof personalDataSchema>;
export type EmploymentDataInput = z.infer<typeof employmentDataSchema>;
export type SalaryDataInput = z.infer<typeof salaryDataSchema>;
export type EmployeeFormInput = z.infer<typeof employeeFormSchema>;

// Validierungsfunktionen
export function validatePersonalData(data: unknown) {
  return personalDataSchema.safeParse(data);
}

export function validateEmploymentData(data: unknown) {
  return employmentDataSchema.safeParse(data);
}

export function validateSalaryData(data: unknown) {
  return salaryDataSchema.safeParse(data);
}

export function validateEmployeeForm(data: unknown) {
  return employeeFormSchema.safeParse(data);
}

// Hilfsfunktion für Fehlermeldungen
export function getValidationErrors(result: z.SafeParseError<unknown>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    errors[path] = issue.message;
  }
  return errors;
}
