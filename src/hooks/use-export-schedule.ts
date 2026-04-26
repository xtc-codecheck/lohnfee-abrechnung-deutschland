/**
 * Monatlicher Exportplan für Steuerberater-Pakete
 *
 * Verwaltet pro Mandant einen Plan, der zu einem definierten Stichtag im Monat
 * automatisch das Steuerberater-Paket für den jeweils letzten abgeschlossenen
 * Vormonat erzeugt und als Download bereithält. Persistenz: localStorage.
 * Generierung: clientseitig (siehe `tax-advisor-package.ts`).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { PayrollEntry, PayrollPeriod } from '@/types/payroll';
import {
  generateTaxAdvisorPackage,
  downloadTaxAdvisorPackage,
} from '@/utils/tax-advisor-package';
import type { Kontenrahmen } from '@/utils/datev-export';
import { useTenant } from '@/contexts/tenant-context';
import { useCompanySettings } from './use-company-settings';

const STORAGE_PREFIX = 'export-schedule';
const PACKAGES_PREFIX = 'export-schedule:packages';
const MAX_PACKAGE_BYTES = 10 * 1024 * 1024; // 10 MB Sicherheitslimit pro Paket im LS
const MAX_PACKAGES = 6;

export interface ExportSchedulePlan {
  enabled: boolean;
  /** Tag im Monat (1–28), an dem der Vormonat automatisch gepackt wird */
  dayOfMonth: number;
  kontenrahmen: Kontenrahmen;
  notes?: string;
  contactName?: string;
  contactEmail?: string;
  /** "YYYY-MM" des zuletzt erfolgreich generierten Pakets */
  lastRunPeriod?: string;
  /** ISO-Datum des letzten Laufs (Erfolg oder Fehler) */
  lastRunAt?: string;
}

export interface PendingPackage {
  id: string;
  period: string; // "YYYY-MM"
  fileName: string;
  /** Base64-kodierter Blob (application/zip) */
  data: string;
  sizeBytes: number;
  createdAt: string;
  kontenrahmen: Kontenrahmen;
  employeeCount: number;
  grossTotal: number;
}

const DEFAULT_PLAN: ExportSchedulePlan = {
  enabled: false,
  dayOfMonth: 5,
  kontenrahmen: 'SKR04',
};

function planKey(tenantId: string | null | undefined): string {
  return `${STORAGE_PREFIX}:${tenantId ?? 'default'}`;
}

function packagesKey(tenantId: string | null | undefined): string {
  return `${PACKAGES_PREFIX}:${tenantId ?? 'default'}`;
}

function safeReadJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWriteJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('[export-schedule] Persistenz fehlgeschlagen:', err);
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buf);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunkSize)) as number[],
    );
  }
  return btoa(binary);
}

function base64ToBlob(b64: string, mime = 'application/zip'): Blob {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function periodLabel(period: string): string {
  // "YYYY-MM" → "MM/YYYY"
  const [y, m] = period.split('-');
  return `${m}/${y}`;
}

function previousMonthLabel(now: Date): string {
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-basiert; Vormonat = m
  const targetMonth = m === 0 ? 12 : m;
  const targetYear = m === 0 ? y - 1 : y;
  return `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
}

function isPeriodMatch(period: PayrollPeriod, label: string): boolean {
  return `${period.year}-${String(period.month).padStart(2, '0')}` === label;
}

function isClosedStatus(status: string | undefined): boolean {
  const s = (status ?? 'draft').toLowerCase();
  return ['closed', 'completed', 'processed', 'abgeschlossen'].includes(s);
}

/** Reiner Plan-Hook (Read/Write) — keine Generierung. */
export function useExportSchedule() {
  const { tenantId } = useTenant();
  const [plan, setPlanState] = useState<ExportSchedulePlan>(() =>
    safeReadJson(planKey(tenantId), DEFAULT_PLAN),
  );
  const [packages, setPackagesState] = useState<PendingPackage[]>(() =>
    safeReadJson(packagesKey(tenantId), []),
  );

  // Bei Mandantenwechsel neu laden
  useEffect(() => {
    setPlanState(safeReadJson(planKey(tenantId), DEFAULT_PLAN));
    setPackagesState(safeReadJson(packagesKey(tenantId), []));
  }, [tenantId]);

  const updatePlan = useCallback(
    (patch: Partial<ExportSchedulePlan>) => {
      setPlanState((prev) => {
        const next = { ...prev, ...patch };
        safeWriteJson(planKey(tenantId), next);
        return next;
      });
    },
    [tenantId],
  );

  const addPackage = useCallback(
    (pkg: PendingPackage) => {
      setPackagesState((prev) => {
        const filtered = prev.filter((p) => p.period !== pkg.period);
        const next = [pkg, ...filtered].slice(0, MAX_PACKAGES);
        safeWriteJson(packagesKey(tenantId), next);
        return next;
      });
    },
    [tenantId],
  );

  const removePackage = useCallback(
    (id: string) => {
      setPackagesState((prev) => {
        const next = prev.filter((p) => p.id !== id);
        safeWriteJson(packagesKey(tenantId), next);
        return next;
      });
    },
    [tenantId],
  );

  const downloadPackage = useCallback((pkg: PendingPackage) => {
    const blob = base64ToBlob(pkg.data);
    downloadTaxAdvisorPackage(blob, pkg.fileName);
  }, []);

  return {
    plan,
    updatePlan,
    packages,
    addPackage,
    removePackage,
    downloadPackage,
  };
}

interface RunnerOptions {
  periods: PayrollPeriod[];
  entries: PayrollEntry[];
}

/**
 * Trigger-Hook: prüft beim Mount + bei Datenänderung, ob ein automatischer Lauf
 * fällig ist und legt das ZIP in die Download-Warteschlange.
 */
export function useExportScheduleRunner({ periods, entries }: RunnerOptions) {
  const { tenantId } = useTenant();
  const { settings: companySettings } = useCompanySettings();
  const schedule = useExportSchedule();
  const inFlight = useRef(false);

  const targetPeriodLabel = useMemo(() => previousMonthLabel(new Date()), []);

  const eligiblePeriod = useMemo(
    () => periods.find((p) => isPeriodMatch(p, targetPeriodLabel)),
    [periods, targetPeriodLabel],
  );

  const eligibleEntries = useMemo(
    () => (eligiblePeriod ? entries.filter((e) => e.payrollPeriodId === eligiblePeriod.id) : []),
    [entries, eligiblePeriod],
  );

  useEffect(() => {
    if (!tenantId) return;
    if (!schedule.plan.enabled) return;
    if (inFlight.current) return;

    const today = new Date();
    const dueDay = Math.max(1, Math.min(28, schedule.plan.dayOfMonth || 5));
    if (today.getDate() < dueDay) return;

    if (schedule.plan.lastRunPeriod === targetPeriodLabel) return;
    if (!eligiblePeriod) return;
    if (!isClosedStatus(eligiblePeriod.status)) return;
    if (eligibleEntries.length === 0) return;

    // Bereits in Warteschlange?
    if (schedule.packages.some((p) => p.period === targetPeriodLabel)) {
      schedule.updatePlan({
        lastRunPeriod: targetPeriodLabel,
        lastRunAt: new Date().toISOString(),
      });
      return;
    }

    inFlight.current = true;
    void (async () => {
      try {
        const companyAddress = [
          companySettings?.street,
          [companySettings?.zip_code, companySettings?.city].filter(Boolean).join(' '),
        ]
          .filter(Boolean)
          .join(', ');

        const { blob, fileName } = await generateTaxAdvisorPackage(
          eligibleEntries,
          eligiblePeriod,
          {
            kontenrahmen: schedule.plan.kontenrahmen,
            companyName: companySettings?.company_name ?? undefined,
            companyAddress: companyAddress || undefined,
            taxNumber: companySettings?.tax_number ?? undefined,
            betriebsnummer: companySettings?.betriebsnummer ?? undefined,
            contactName: schedule.plan.contactName || undefined,
            contactEmail:
              schedule.plan.contactEmail || companySettings?.contact_email || undefined,
            notes: schedule.plan.notes || undefined,
          },
        );

        if (blob.size > MAX_PACKAGE_BYTES) {
          toast.warning('Exportplan: Paket zu groß für Auto-Speicher', {
            description: `${fileName} ist ${(blob.size / 1024 / 1024).toFixed(1)} MB. Bitte manuell aus dem Dialog herunterladen.`,
          });
          schedule.updatePlan({
            lastRunPeriod: targetPeriodLabel,
            lastRunAt: new Date().toISOString(),
          });
          return;
        }

        const data = await blobToBase64(blob);
        const grossTotal = eligibleEntries.reduce(
          (s, e) => s + e.salaryCalculation.grossSalary,
          0,
        );

        schedule.addPackage({
          id: `pkg-${Date.now()}`,
          period: targetPeriodLabel,
          fileName,
          data,
          sizeBytes: blob.size,
          createdAt: new Date().toISOString(),
          kontenrahmen: schedule.plan.kontenrahmen,
          employeeCount: eligibleEntries.length,
          grossTotal,
        });

        schedule.updatePlan({
          lastRunPeriod: targetPeriodLabel,
          lastRunAt: new Date().toISOString(),
        });

        toast.success('Steuerberater-Paket bereit', {
          description: `${periodLabel(targetPeriodLabel)} wurde automatisch erstellt und liegt zum Download bereit.`,
        });
      } catch (err) {
        console.error('[export-schedule] Auto-Lauf fehlgeschlagen:', err);
        toast.error('Automatischer Export fehlgeschlagen', {
          description: err instanceof Error ? err.message : 'Unbekannter Fehler.',
        });
      } finally {
        inFlight.current = false;
      }
    })();
  }, [
    tenantId,
    schedule,
    targetPeriodLabel,
    eligiblePeriod,
    eligibleEntries,
    companySettings,
  ]);

  return {
    targetPeriodLabel,
    eligiblePeriod,
    eligibleEntries,
  };
}
