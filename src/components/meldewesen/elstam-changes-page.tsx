import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2, ShieldCheck, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/tenant-context";
import { useToast } from "@/hooks/use-toast";
import { processElstamChange } from "@/utils/elstam-change-handler";
import { logger } from "@/lib/logger";

interface Props { onBack: () => void }

const FIELD_LABELS: Record<string, string> = {
  tax_class: "Steuerklasse",
  tax_id: "Steuer-ID",
  church_tax: "Kirchensteuerpflicht",
  church_tax_rate: "Kirchensteuersatz",
  children_allowance: "Kinderfreibetrag",
  number_of_children: "Anzahl Kinder",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  open: "destructive",
  processed: "default",
  ignored: "secondary",
};

export function ElstamChangesPage({ onBack }: Props) {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("elstam_changes")
      .select("*, employees(first_name, last_name, personal_number)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      logger.error("elstam-changes", "Laden fehlgeschlagen", error);
      toast({ title: "Fehler beim Laden", description: error.message, variant: "destructive" });
    }
    setItems(data ?? []);
    setLoading(false);
  }, [tenantId, toast]);

  useEffect(() => { load(); }, [load]);

  const process = async (id: string) => {
    setBusyId(id);
    try {
      const r = await processElstamChange(id);
      toast({
        title: r.requiresPayrollCorrection ? "Verarbeitet" : "Ignoriert",
        description: `${r.affectedEntryIds.length} Abrechnung(en) betroffen.`,
      });
      await load();
    } catch (e: any) {
      logger.error("elstam-changes", "Verarbeitung fehlgeschlagen", e);
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const openCount = items.filter(i => i.status === "open").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="ELStAM-Änderungen"
        description="Steuerlich relevante Stammdaten-Änderungen mit Korrekturhinweisen (§ 39 / § 41c EStG)"
        onBack={onBack}
      />

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Inbox · {openCount} offen
          </CardTitle>
          <CardDescription>
            Jede Änderung an Steuerklasse, Steuer-ID, Kirchensteuer, Kinderfreibetrag oder
            Kinderzahl wird automatisch erfasst. „Verarbeiten" ermittelt die betroffenen
            Abrechnungen ab dem Stichtag und markiert den Eintrag.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Lade Änderungen…
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Änderungen vorhanden.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stichtag</TableHead>
                  <TableHead>Mitarbeiter</TableHead>
                  <TableHead>Feld</TableHead>
                  <TableHead>Alt → Neu</TableHead>
                  <TableHead>Betroffene</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it) => {
                  const emp = it.employees;
                  const empLabel = emp
                    ? `${emp.last_name}, ${emp.first_name}${emp.personal_number ? ` (#${emp.personal_number})` : ""}`
                    : "—";
                  return (
                    <TableRow key={it.id}>
                      <TableCell className="whitespace-nowrap text-sm">{it.effective_date}</TableCell>
                      <TableCell className="text-sm">{empLabel}</TableCell>
                      <TableCell className="text-sm">{FIELD_LABELS[it.field_name] ?? it.field_name}</TableCell>
                      <TableCell className="text-sm font-mono">
                        {it.old_value ?? "∅"} → {it.new_value ?? "∅"}
                      </TableCell>
                      <TableCell className="text-sm">{it.affected_entry_ids?.length ?? 0}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[it.status] ?? "outline"}>{it.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {it.status === "open" && (
                          <Button size="sm" variant="outline" disabled={busyId === it.id} onClick={() => process(it.id)}>
                            {busyId === it.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <><RefreshCw className="h-3 w-3 mr-1" /> Verarbeiten</>
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
