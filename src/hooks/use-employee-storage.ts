/**
 * Mitarbeiter-Storage Hook
 * 
 * WICHTIG: Dieser Hook verwendet jetzt verschlüsselte Speicherung
 * für sensible Mitarbeiterdaten (Steuer-ID, IBAN, Gehalt etc.)
 * 
 * Die Implementierung ist in use-secure-employee-storage.ts
 * Dieser Export bleibt für Abwärtskompatibilität bestehen.
 */

export { 
  useSecureEmployeeStorage as useEmployeeStorage,
  useSecureEmployeeStorage,
  type SecureEmployeeStorageState,
  type SecureEmployeeStorageActions,
} from './use-secure-employee-storage';
