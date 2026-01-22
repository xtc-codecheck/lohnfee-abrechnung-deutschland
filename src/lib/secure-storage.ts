/**
 * SecureStorage - Verschlüsselte localStorage-Speicherung
 * 
 * Verwendet AES-256 Verschlüsselung via crypto-js für sensible Daten.
 * Unterstützt optionales Master-Passwort und automatische Session-Verwaltung.
 */

import CryptoJS from 'crypto-js';

// ============= Konfiguration =============

/**
 * Standard-Konfiguration für SecureStorage
 */
const CONFIG = {
  // Prefix für alle verschlüsselten Schlüssel
  KEY_PREFIX: 'lohnpro_secure_',
  // Session-Timeout in Millisekunden (30 Minuten)
  SESSION_TIMEOUT: 30 * 60 * 1000,
  // Key für Session-Timestamp
  SESSION_KEY: 'lohnpro_session_ts',
  // Key für verschlüsselten Passwort-Hash (zur Validierung)
  HASH_KEY: 'lohnpro_key_hash',
} as const;

// ============= Typen =============

export interface SecureStorageOptions {
  /** Eigener Verschlüsselungsschlüssel (optional, sonst wird Geräte-ID verwendet) */
  encryptionKey?: string;
  /** Session-Timeout in Millisekunden */
  sessionTimeout?: number;
}

export interface SecureStorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============= Interne Helfer =============

/**
 * Generiert einen Geräte-spezifischen Schlüssel
 * Basiert auf Browser-Eigenschaften für zusätzliche Sicherheit
 */
function generateDeviceKey(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width.toString(),
    screen.height.toString(),
    new Date().getTimezoneOffset().toString(),
  ];
  
  // Hash der Komponenten erstellen
  const combined = components.join('|');
  return CryptoJS.SHA256(combined).toString();
}

/**
 * Kombiniert Geräte-Schlüssel mit optionalem Master-Passwort
 */
function deriveKey(masterPassword?: string): string {
  const deviceKey = generateDeviceKey();
  
  if (masterPassword) {
    // PBKDF2 für Passwort-Ableitung
    const salt = CryptoJS.SHA256(deviceKey).toString();
    return CryptoJS.PBKDF2(masterPassword, salt, {
      keySize: 256 / 32,
      iterations: 10000,
    }).toString();
  }
  
  return deviceKey;
}

/**
 * Prüft ob die Session noch gültig ist
 */
function isSessionValid(timeout: number): boolean {
  const timestampStr = localStorage.getItem(CONFIG.SESSION_KEY);
  if (!timestampStr) return false;
  
  const timestamp = parseInt(timestampStr, 10);
  const now = Date.now();
  
  return (now - timestamp) < timeout;
}

/**
 * Aktualisiert den Session-Timestamp
 */
function updateSessionTimestamp(): void {
  localStorage.setItem(CONFIG.SESSION_KEY, Date.now().toString());
}

// ============= Haupt-Klasse =============

/**
 * SecureStorage-Klasse für verschlüsselte Datenspeicherung
 * 
 * @example
 * ```typescript
 * const storage = new SecureStorage({ encryptionKey: 'mein-passwort' });
 * 
 * // Daten speichern
 * storage.setItem('employees', employeeData);
 * 
 * // Daten abrufen
 * const result = storage.getItem<Employee[]>('employees');
 * if (result.success) {
 *   console.log(result.data);
 * }
 * ```
 */
export class SecureStorage {
  private encryptionKey: string;
  private sessionTimeout: number;

  constructor(options: SecureStorageOptions = {}) {
    this.encryptionKey = deriveKey(options.encryptionKey);
    this.sessionTimeout = options.sessionTimeout ?? CONFIG.SESSION_TIMEOUT;
    
    // Session initialisieren
    updateSessionTimestamp();
  }

  /**
   * Prüft ob die Session noch aktiv ist
   */
  isSessionActive(): boolean {
    return isSessionValid(this.sessionTimeout);
  }

  /**
   * Verlängert die aktive Session
   */
  extendSession(): void {
    updateSessionTimestamp();
  }

  /**
   * Beendet die Session und löscht den Session-Timestamp
   */
  endSession(): void {
    localStorage.removeItem(CONFIG.SESSION_KEY);
  }

  /**
   * Verschlüsselt und speichert Daten
   */
  setItem<T>(key: string, data: T): SecureStorageResult<void> {
    try {
      // Session prüfen/aktualisieren
      if (!this.isSessionActive()) {
        updateSessionTimestamp();
      }
      this.extendSession();

      // Daten serialisieren und verschlüsseln
      const jsonData = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonData, this.encryptionKey).toString();

      // Verschlüsselte Daten speichern
      const storageKey = CONFIG.KEY_PREFIX + key;
      localStorage.setItem(storageKey, encrypted);

      return { success: true };
    } catch (error) {
      console.error('SecureStorage: Fehler beim Speichern', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Speichern',
      };
    }
  }

  /**
   * Lädt und entschlüsselt Daten
   */
  getItem<T>(key: string): SecureStorageResult<T> {
    try {
      // Session verlängern
      this.extendSession();

      const storageKey = CONFIG.KEY_PREFIX + key;
      const encrypted = localStorage.getItem(storageKey);

      if (!encrypted) {
        return { success: true, data: undefined };
      }

      // Entschlüsseln
      const decrypted = CryptoJS.AES.decrypt(encrypted, this.encryptionKey);
      const jsonData = decrypted.toString(CryptoJS.enc.Utf8);

      if (!jsonData) {
        return {
          success: false,
          error: 'Entschlüsselung fehlgeschlagen - möglicherweise falscher Schlüssel',
        };
      }

      // Parsen
      const data = JSON.parse(jsonData) as T;
      return { success: true, data };
    } catch (error) {
      console.error('SecureStorage: Fehler beim Laden', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Laden',
      };
    }
  }

  /**
   * Löscht einen Eintrag
   */
  removeItem(key: string): SecureStorageResult<void> {
    try {
      const storageKey = CONFIG.KEY_PREFIX + key;
      localStorage.removeItem(storageKey);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Löschen',
      };
    }
  }

  /**
   * Listet alle gespeicherten Schlüssel auf
   */
  keys(): string[] {
    const keys: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CONFIG.KEY_PREFIX)) {
        keys.push(key.replace(CONFIG.KEY_PREFIX, ''));
      }
    }
    
    return keys;
  }

  /**
   * Löscht alle verschlüsselten Daten
   */
  clear(): SecureStorageResult<void> {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CONFIG.KEY_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Löschen',
      };
    }
  }

  /**
   * Exportiert alle Daten verschlüsselt für Backup
   */
  exportEncrypted(): SecureStorageResult<string> {
    try {
      const data: Record<string, string> = {};
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CONFIG.KEY_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            data[key] = value;
          }
        }
      }
      
      // Zusätzliche Verschlüsselung für Export
      const exportData = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(exportData, this.encryptionKey).toString();
      
      return { success: true, data: encrypted };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Fehler beim Exportieren',
      };
    }
  }

  /**
   * Importiert verschlüsselte Backup-Daten
   */
  importEncrypted(encryptedData: string): SecureStorageResult<number> {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const jsonData = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!jsonData) {
        return {
          success: false,
          error: 'Import fehlgeschlagen - möglicherweise falscher Schlüssel',
        };
      }
      
      const data = JSON.parse(jsonData) as Record<string, string>;
      let count = 0;
      
      for (const [key, value] of Object.entries(data)) {
        localStorage.setItem(key, value);
        count++;
      }
      
      return { success: true, data: count };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Fehler beim Importieren',
      };
    }
  }
}

// ============= Singleton-Instanz =============

let secureStorageInstance: SecureStorage | null = null;

/**
 * Gibt die Singleton-Instanz von SecureStorage zurück
 */
export function getSecureStorage(options?: SecureStorageOptions): SecureStorage {
  if (!secureStorageInstance) {
    secureStorageInstance = new SecureStorage(options);
  }
  return secureStorageInstance;
}

/**
 * Setzt die SecureStorage-Instanz zurück (z.B. bei Logout)
 */
export function resetSecureStorage(): void {
  if (secureStorageInstance) {
    secureStorageInstance.endSession();
    secureStorageInstance = null;
  }
}

// ============= Migrations-Helfer =============

/**
 * Migriert unverschlüsselte Daten in verschlüsselte Speicherung
 * 
 * @param oldKey - Der alte localStorage-Schlüssel
 * @param newKey - Der neue Schlüssel für SecureStorage
 * @param storage - Die SecureStorage-Instanz
 * @param deleteOld - Ob die alten Daten gelöscht werden sollen
 */
export function migrateToSecureStorage<T>(
  oldKey: string,
  newKey: string,
  storage: SecureStorage,
  deleteOld = true
): SecureStorageResult<T> {
  try {
    const oldData = localStorage.getItem(oldKey);
    
    if (!oldData) {
      return { success: true, data: undefined };
    }
    
    // Alte Daten parsen
    const parsed = JSON.parse(oldData) as T;
    
    // In SecureStorage speichern
    const saveResult = storage.setItem(newKey, parsed);
    if (!saveResult.success) {
      return saveResult as SecureStorageResult<T>;
    }
    
    // Alte Daten löschen (optional)
    if (deleteOld) {
      localStorage.removeItem(oldKey);
    }
    
    return { success: true, data: parsed };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Migrationsfehler',
    };
  }
}

// ============= Sensible Felder-Definition =============

/**
 * Liste der als sensibel eingestuften Felder
 * Diese werden automatisch verschlüsselt gespeichert
 */
export const SENSITIVE_FIELDS = [
  'taxId',
  'socialSecurityNumber',
  'iban',
  'bic',
  'grossSalary',
  'hourlyWage',
  'netSalary',
  'bankingData',
  'dateOfBirth',
] as const;

export type SensitiveField = typeof SENSITIVE_FIELDS[number];

/**
 * Prüft ob ein Feldname sensible Daten enthält
 */
export function isSensitiveField(fieldName: string): boolean {
  return SENSITIVE_FIELDS.some(field => 
    fieldName.toLowerCase().includes(field.toLowerCase())
  );
}
