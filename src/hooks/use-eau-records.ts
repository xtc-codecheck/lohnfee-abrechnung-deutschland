import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/tenant-context";

export interface EauRecord {
  id: string;
  tenant_id: string;
  employee_id: string;
  au_von: string;
  au_bis: string;
  diagnose_vorhanden: boolean;
  ist_folge_au: boolean;
  abruf_status: "offen" | "abgerufen" | "fehler" | "manuell";
  abruf_datum: string | null;
  arzt_name: string | null;
  arbeitgeber_kenntnis_datum: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useEauRecords() {
  const { tenantId } = useTenant();
  const [records, setRecords] = useState<EauRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!tenantId) {
      setRecords([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data, error: err } = await supabase
      .from("eau_records" as any)
      .select("*")
      .eq("tenant_id", tenantId)
      .order("au_von", { ascending: false })
      .limit(200);

    if (err) setError(err.message);
    else setRecords((data ?? []) as unknown as EauRecord[]);
    setIsLoading(false);
  }, [tenantId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const createRecord = useCallback(
    async (values: Partial<EauRecord>) => {
      if (!tenantId) return false;
      const { error: err } = await supabase
        .from("eau_records" as any)
        .insert({ ...values, tenant_id: tenantId } as any);
      if (err) {
        setError(err.message);
        return false;
      }
      await fetch();
      return true;
    },
    [tenantId, fetch],
  );

  const updateRecord = useCallback(
    async (id: string, values: Partial<EauRecord>) => {
      const { error: err } = await supabase
        .from("eau_records" as any)
        .update(values as any)
        .eq("id", id);
      if (err) {
        setError(err.message);
        return false;
      }
      await fetch();
      return true;
    },
    [fetch],
  );

  return { records, isLoading, error, createRecord, updateRecord, refresh: fetch };
}