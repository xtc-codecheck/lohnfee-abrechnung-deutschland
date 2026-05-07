/**
 * SV-Übermittlungs-Provider Interface
 * ─────────────────────────────────────────────────────────────
 * Abstrahiert sv.net / dakota.le / ITSG-Kommunikationsschicht
 * hinter einem einheitlichen Interface (Phase 4).
 *
 * Im Standalone-Modus verwendet die App den
 * `StubSvSubmissionProvider`, der Quittungen lokal simuliert.
 * Produktiv wird der `EdgeFunctionSvSubmissionProvider` über
 * die Edge Function `sv-net-submit` angebunden.
 */

export type SubmissionProtocol = 'svnet' | 'dakota' | 'itsg';

export interface SvSubmissionRequest {
  protocol: SubmissionProtocol;
  meldungType: 'DEUEV' | 'BNW' | 'EEL' | 'BEA' | 'AAG' | 'UV-DSLN';
  payloadXml: string;
  /** Empfänger-Betriebsnummer (KK) */
  empfaengerBbnr?: string;
}

export interface SvSubmissionReceipt {
  ticketId: string;
  acceptedAt: string;
  status: 'accepted' | 'rejected' | 'pending';
  message?: string;
  raw?: unknown;
}

export interface ISvSubmissionProvider {
  submit(req: SvSubmissionRequest): Promise<SvSubmissionReceipt>;
  fetchReceipt(ticketId: string): Promise<SvSubmissionReceipt | null>;
}

export class StubSvSubmissionProvider implements ISvSubmissionProvider {
  async submit(req: SvSubmissionRequest): Promise<SvSubmissionReceipt> {
    return {
      ticketId: 'STUB-' + Math.random().toString(36).slice(2, 10).toUpperCase(),
      acceptedAt: new Date().toISOString(),
      status: 'accepted',
      message: `Stub-Quittung (${req.protocol}/${req.meldungType}) – nicht produktiv übermittelt.`,
    };
  }
  async fetchReceipt(ticketId: string): Promise<SvSubmissionReceipt | null> {
    return {
      ticketId,
      acceptedAt: new Date().toISOString(),
      status: 'accepted',
      message: 'Stub – keine echte Quittungsabholung.',
    };
  }
}