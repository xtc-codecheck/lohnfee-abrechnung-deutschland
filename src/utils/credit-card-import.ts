/**
 * Kreditkarten-CSV-Import für Reisekosten-Belege.
 * Unterstützt gängige Formate (Amex, Visa Business, Mastercard, DKB).
 * Spalten werden heuristisch erkannt: Datum, Beschreibung, Betrag, Währung.
 */

export interface ParsedTransaction {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // EUR positiv = Aufwand
  currency: string;
  category?: 'lodging' | 'meal' | 'transport' | 'fuel' | 'other';
}

const DATE_KEYS = ['datum', 'belegdatum', 'transaktionsdatum', 'date', 'buchungstag'];
const DESC_KEYS = ['beschreibung', 'verwendungszweck', 'description', 'merchant', 'haendler'];
const AMOUNT_KEYS = ['betrag', 'amount', 'eur', 'umsatz'];
const CURRENCY_KEYS = ['waehrung', 'currency'];

function detectCategory(desc: string): ParsedTransaction['category'] {
  const d = desc.toLowerCase();
  if (/(hotel|booking|airbnb|accor|marriott|hilton)/.test(d)) return 'lodging';
  if (/(restaurant|mcdonald|burger|cafe|kaffee|gastro|pizza)/.test(d)) return 'meal';
  if (/(db|bahn|lufthansa|uber|taxi|sncf|easyjet|ryanair|flug)/.test(d)) return 'transport';
  if (/(shell|aral|esso|tankstelle|total|bp )/.test(d)) return 'fuel';
  return 'other';
}

function parseDate(s: string): string {
  const t = s.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  const m = t.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})/);
  if (m) {
    const yy = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${yy}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  }
  return new Date().toISOString().slice(0, 10);
}

function parseAmount(s: string): number {
  const cleaned = s.replace(/[^0-9,.\-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : Math.abs(n);
}

export function parseCreditCardCsv(csv: string): ParsedTransaction[] {
  const lines = csv.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const sep = lines[0].includes(';') ? ';' : ',';
  const header = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  const idx = (keys: string[]) => header.findIndex(h => keys.some(k => h.includes(k)));
  const dateIdx = idx(DATE_KEYS);
  const descIdx = idx(DESC_KEYS);
  const amountIdx = idx(AMOUNT_KEYS);
  const curIdx = idx(CURRENCY_KEYS);
  if (dateIdx < 0 || amountIdx < 0) return [];

  const out: ParsedTransaction[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map(c => c.trim().replace(/^"|"$/g, ''));
    const desc = (descIdx >= 0 ? cols[descIdx] : '') || '';
    const amt = parseAmount(cols[amountIdx] ?? '');
    if (amt === 0) continue;
    out.push({
      date: parseDate(cols[dateIdx] ?? ''),
      description: desc,
      amount: amt,
      currency: (curIdx >= 0 ? cols[curIdx] : 'EUR') || 'EUR',
      category: detectCategory(desc),
    });
  }
  return out;
}