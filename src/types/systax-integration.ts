/**
 * SYSTAX-Integrations-Interfaces
 * 
 * Abstrakte Service-Layer für die Anbindung von LohnPro an das SYSTAX-Hauptsystem.
 * ELSTER und finAPI sind bereits im Hauptsystem implementiert –
 * diese Interfaces definieren den Vertrag zwischen LohnPro und SYSTAX.
 */

// ============================================================
// 1. ELSTER – Elektronische Steuererklärung
// ============================================================

/** Gemeinsamer Status für alle ELSTER-Übermittlungen */
export type ElsterTransferStatus =
  | 'draft'           // Entwurf, noch nicht gesendet
  | 'validating'      // Wird validiert
  | 'submitted'       // An ELSTER übermittelt
  | 'accepted'        // Vom Finanzamt akzeptiert
  | 'rejected'        // Abgelehnt (Fehler im Datensatz)
  | 'corrected';      // Korrekturmeldung gesendet

/** Ergebnis einer ELSTER-Übermittlung */
export interface ElsterTransferResult {
  success: boolean;
  transferTicket: string | null;
  timestamp: string;
  errors: ElsterError[];
  warnings: ElsterWarning[];
}

export interface ElsterError {
  code: string;
  field: string;
  message: string;
}

export interface ElsterWarning {
  code: string;
  message: string;
}

// --- 1a. Lohnsteueranmeldung (§ 41a EStG) ---

export interface LohnsteueranmeldungPayload {
  steuernummer: string;
  finanzamt: string;
  anmeldezeitraum: 'monatlich' | 'vierteljaehrlich' | 'jaehrlich';
  year: number;
  month: number;
  /** Summe einbehaltene Lohnsteuer */
  summeLohnsteuer: number;
  /** Summe Solidaritätszuschlag */
  summeSolidaritaetszuschlag: number;
  /** Summe Kirchensteuer ev. */
  summeKirchensteuerEv: number;
  /** Summe Kirchensteuer rk. */
  summeKirchensteuerRk: number;
  /** Pauschale Lohnsteuer (§ 40a) */
  summePauschaleLohnsteuer: number;
  /** Gesamtbetrag zur Überweisung */
  gesamtbetrag: number;
  /** Anzahl Arbeitnehmer */
  anzahlArbeitnehmer: number;
  /** Korrektur einer vorherigen Anmeldung? */
  istKorrektur: boolean;
  korrekturVon?: string;
}

// --- 1b. Lohnsteuerbescheinigung (§ 41b EStG) ---

export interface LohnsteuerbescheinigungPayload {
  year: number;
  employeeId: string;
  /** Steuer-ID des Arbeitnehmers */
  steuerIdentifikationsnummer: string;
  steuerklasse: string;
  kinderfreibetraege: number;
  religion?: string;
  zeitraumVon: string;
  zeitraumBis: string;
  /** Zeile 3: Bruttoarbeitslohn */
  zeile3Bruttolohn: number;
  /** Zeile 4: Einbehaltene Lohnsteuer */
  zeile4Lohnsteuer: number;
  /** Zeile 5: Solidaritätszuschlag */
  zeile5Soli: number;
  /** Zeile 6: Kirchensteuer AN */
  zeile6Kirchensteuer: number;
  /** Zeile 7: Kirchensteuer Ehegatte */
  zeile7KirchensteuerEhegatte: number;
  /** Zeilen 22a/b: RV AN/AG */
  zeile22aRvAn: number;
  zeile22bRvAg: number;
  /** Zeilen 23a/b: KV AN/AG */
  zeile23aKvAn: number;
  zeile23bKvAg: number;
  /** Zeilen 24a/b: AV AN/AG */
  zeile24aAvAn: number;
  zeile24bAvAg: number;
  /** Zeile 25: PV AN */
  zeile25PvAn: number;
  /** Zeile 26: PV AG */
  zeile26PvAg: number;
}

// --- 1c. SV-Meldungen (DEÜV) ---

export interface SvMeldungPayload {
  /** Betriebsnummer des Arbeitgebers */
  betriebsnummerAg: string;
  /** Betriebsnummer der Krankenkasse */
  betriebsnummerKk: string;
  /** SV-Nummer des Arbeitnehmers */
  svNummer: string;
  employeeId: string;
  meldegrund: SvMeldegrund;
  meldegrundSchluessel: string;
  personengruppe: string;
  beitragsgruppe: string;
  zeitraumVon: string;
  zeitraumBis: string;
  svBrutto: number;
}

export type SvMeldegrund =
  | 'anmeldung'
  | 'abmeldung'
  | 'jahresmeldung'
  | 'unterbrechung'
  | 'aenderung'
  | 'gkv_monatsmeldung';

// --- 1d. Beitragsnachweis ---

export interface BeitragsnachweisPayload {
  betriebsnummerAg: string;
  betriebsnummerKk: string;
  krankenkasse: string;
  year: number;
  month: number;
  faelligkeitsdatum: string;
  anzahlVersicherte: number;
  kvAn: number;
  kvAg: number;
  kvZusatzbeitragAn: number;
  kvZusatzbeitragAg: number;
  rvAn: number;
  rvAg: number;
  avAn: number;
  avAg: number;
  pvAn: number;
  pvAg: number;
  pvKinderloseZuschlag: number;
  umlageU1: number;
  umlageU2: number;
  insolvenzgeldumlage: number;
  gesamtbetrag: number;
}

// --- ELSTER Service Interface ---

/**
 * Abstraktes ELSTER-Service-Interface.
 * Wird im SYSTAX-Hauptsystem konkret implementiert.
 * LohnPro ruft diese Methoden auf, um Meldungen zu übermitteln.
 */
export interface IElsterService {
  /** Lohnsteueranmeldung an ELSTER senden */
  submitLohnsteueranmeldung(
    payload: LohnsteueranmeldungPayload
  ): Promise<ElsterTransferResult>;

  /** Lohnsteuerbescheinigung an ELSTER senden */
  submitLohnsteuerbescheinigung(
    payload: LohnsteuerbescheinigungPayload
  ): Promise<ElsterTransferResult>;

  /** SV-Meldung über SV-Meldeportal senden */
  submitSvMeldung(
    payload: SvMeldungPayload
  ): Promise<ElsterTransferResult>;

  /** Beitragsnachweis an Krankenkasse senden */
  submitBeitragsnachweis(
    payload: BeitragsnachweisPayload
  ): Promise<ElsterTransferResult>;

  /** Status einer Übermittlung abfragen */
  getTransferStatus(
    transferTicket: string
  ): Promise<ElsterTransferStatus>;

  /** Protokoll/Bescheid zu einem Transfer abrufen */
  getTransferProtocol(
    transferTicket: string
  ): Promise<ElsterProtocol>;
}

export interface ElsterProtocol {
  transferTicket: string;
  status: ElsterTransferStatus;
  receivedAt: string;
  processedAt: string | null;
  responseXml: string | null;
  errors: ElsterError[];
}

// ============================================================
// 2. finAPI – Bankanbindung / SEPA-Überweisungen
// ============================================================

/** Einzelne Gehaltsüberweisung */
export interface SalaryPayment {
  /** LohnPro payroll_entry ID */
  payrollEntryId: string;
  /** Empfänger */
  recipientName: string;
  recipientIban: string;
  recipientBic?: string;
  /** Betrag in Euro (positiv) */
  amount: number;
  /** Verwendungszweck */
  purpose: string;
  /** Gewünschtes Ausführungsdatum (ISO 8601) */
  executionDate: string;
}

/** Sammelüberweisung für eine Abrechnungsperiode */
export interface SalaryBatchPayment {
  /** Eindeutige Batch-ID */
  batchId: string;
  /** Auftraggeber */
  senderName: string;
  senderIban: string;
  senderBic?: string;
  /** Einzelzahlungen */
  payments: SalaryPayment[];
  /** Gesamtbetrag (Summe aller payments) */
  totalAmount: number;
  /** Abrechnungsperiode */
  year: number;
  month: number;
  tenantId: string;
}

export type PaymentStatus =
  | 'pending'      // Auftrag erstellt, noch nicht ausgeführt
  | 'authorized'   // Vom Benutzer autorisiert (TAN/2FA)
  | 'processing'   // Bei der Bank in Verarbeitung
  | 'executed'     // Erfolgreich ausgeführt
  | 'failed'       // Fehlgeschlagen
  | 'cancelled';   // Storniert

export interface PaymentResult {
  paymentId: string;
  payrollEntryId: string;
  status: PaymentStatus;
  executedAt: string | null;
  bankReference: string | null;
  error: PaymentError | null;
}

export interface PaymentError {
  code: string;
  message: string;
  /** z.B. ungültige IBAN, Deckung, Tageslimit */
  category: 'validation' | 'authorization' | 'execution' | 'bank';
}

export interface BatchPaymentResult {
  batchId: string;
  status: PaymentStatus;
  results: PaymentResult[];
  successCount: number;
  failedCount: number;
  totalAmount: number;
}

/** Kontostand-Abfrage für Deckungsprüfung */
export interface BankAccountBalance {
  iban: string;
  balance: number;
  currency: string;
  availableBalance: number;
  lastUpdated: string;
}

/**
 * Abstraktes finAPI-Service-Interface.
 * Wird im SYSTAX-Hauptsystem konkret implementiert.
 * LohnPro ruft diese Methoden auf, um Gehälter zu überweisen.
 */
export interface IFinApiService {
  /** Einzelne Gehaltsüberweisung ausführen */
  submitPayment(
    payment: SalaryPayment,
    senderIban: string
  ): Promise<PaymentResult>;

  /** Sammelüberweisung für eine Abrechnungsperiode */
  submitBatchPayment(
    batch: SalaryBatchPayment
  ): Promise<BatchPaymentResult>;

  /** Status einer Zahlung abfragen */
  getPaymentStatus(
    paymentId: string
  ): Promise<PaymentResult>;

  /** Status einer Sammelüberweisung abfragen */
  getBatchStatus(
    batchId: string
  ): Promise<BatchPaymentResult>;

  /** Kontostand abfragen (Deckungsprüfung vor Gehaltslauf) */
  getAccountBalance(
    iban: string
  ): Promise<BankAccountBalance>;

  /** Autorisierung starten (TAN-Verfahren) */
  authorizePayment(
    paymentId: string,
    method: 'push_tan' | 'sms_tan' | 'photo_tan'
  ): Promise<{ authorizationUrl?: string; requiresTan: boolean }>;
}

// ============================================================
// 3. SYSTAX Integration Facade
// ============================================================

/**
 * Zentrale Fassade für die SYSTAX-Integration.
 * LohnPro nutzt dieses Interface, um auf alle externen Dienste zuzugreifen.
 * Das SYSTAX-Hauptsystem stellt die konkrete Implementierung bereit.
 */
export interface ISystaxIntegration {
  readonly elster: IElsterService;
  readonly finApi: IFinApiService;

  /** Prüft ob die SYSTAX-Integration verfügbar ist */
  isAvailable(): Promise<boolean>;

  /** Gibt die SYSTAX-Version zurück */
  getVersion(): Promise<string>;
}

/**
 * Placeholder-Implementierung für den Standalone-Betrieb von LohnPro.
 * Alle Methoden werfen einen Fehler mit Hinweis auf SYSTAX.
 */
export class SystaxIntegrationStub implements ISystaxIntegration {
  get elster(): IElsterService {
    throw new Error(
      'ELSTER ist nur über das SYSTAX-Hauptsystem verfügbar. ' +
      'Bitte upgraden Sie auf SYSTAX für elektronische Meldungen.'
    );
  }

  get finApi(): IFinApiService {
    throw new Error(
      'Bankanbindung (finAPI) ist nur über das SYSTAX-Hauptsystem verfügbar. ' +
      'Bitte upgraden Sie auf SYSTAX für automatische Gehaltsüberweisungen.'
    );
  }

  async isAvailable(): Promise<boolean> {
    return false;
  }

  async getVersion(): Promise<string> {
    return 'standalone';
  }
}
