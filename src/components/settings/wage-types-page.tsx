import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Sparkles, Lock } from "lucide-react";
import { useWageTypes } from "@/hooks/use-wage-types";
import { WageType, WageTypeCategory, AmountType, CATEGORY_LABELS } from "@/types/wage-types";

const emptyForm: Partial<WageType> = {
  code: "", name: "", category: "bezug", is_taxable: true, is_sv_relevant: true,
  pauschal_tax_rate: 0, account_skr03: "", account_skr04: "", default_amount: 0,
  amount_type: "fixed", is_active: true, is_system: false, description: "",
};

export function WageTypesPage() {
  const { wageTypes, loading, seedDefaults, createWageType, updateWageType, deleteWageType } = useWageTypes();
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<WageType>>(emptyForm);

  const handleEdit = (wt: WageType) => { setEditing(wt); setEditOpen(true); };
  const handleNew = () => { setEditing(emptyForm); setEditOpen(true); };
  const handleSave = async () => {
    if (!editing.code || !editing.name) return;
    if (editing.id) await updateWageType(editing.id, editing);
    else await createWageType(editing);
    setEditOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Lohnarten-Katalog</CardTitle>
          <CardDescription>
            Frei konfigurierbare Bezüge und Abzüge (VWL, Sachbezug, Pfändung, Zuschüsse, ...) – steuer- und SV-rechtlich abgebildet.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          {wageTypes.length === 0 && (
            <Button variant="outline" onClick={seedDefaults}>
              <Sparkles className="h-4 w-4 mr-2" /> Standardkatalog laden
            </Button>
          )}
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" /> Neue Lohnart
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Lade...</div>
        ) : wageTypes.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-muted-foreground">Noch keine Lohnarten angelegt.</p>
            <p className="text-sm text-muted-foreground">Klicken Sie auf "Standardkatalog laden", um die 10 wichtigsten Lohnarten zu importieren.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Bezeichnung</TableHead>
                <TableHead>Kategorie</TableHead>
                <TableHead>Steuer</TableHead>
                <TableHead>SV</TableHead>
                <TableHead>Pauschal %</TableHead>
                <TableHead>Default €</TableHead>
                <TableHead>SKR03/04</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wageTypes.map((wt) => (
                <TableRow key={wt.id}>
                  <TableCell className="font-mono text-xs">{wt.code}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {wt.name}
                      {wt.is_system && <Lock className="h-3 w-3 text-muted-foreground" aria-label="System-Lohnart" />}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{CATEGORY_LABELS[wt.category]}</Badge></TableCell>
                  <TableCell>{wt.is_taxable ? "ja" : "nein"}</TableCell>
                  <TableCell>{wt.is_sv_relevant ? "ja" : "nein"}</TableCell>
                  <TableCell>{wt.pauschal_tax_rate > 0 ? `${wt.pauschal_tax_rate}%` : "—"}</TableCell>
                  <TableCell>{wt.default_amount > 0 ? `${wt.default_amount.toFixed(2)}` : "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{wt.account_skr03 || "—"} / {wt.account_skr04 || "—"}</TableCell>
                  <TableCell>{wt.is_active ? <Badge>aktiv</Badge> : <Badge variant="outline">inaktiv</Badge>}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(wt)}><Edit className="h-4 w-4" /></Button>
                    {!wt.is_system && (
                      <Button size="icon" variant="ghost" onClick={() => deleteWageType(wt.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing.id ? "Lohnart bearbeiten" : "Neue Lohnart"}</DialogTitle>
            <DialogDescription>Definieren Sie steuerliche und SV-rechtliche Behandlung sowie Buchungskonten.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label>Code</Label>
              <Input value={editing.code ?? ""} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} disabled={editing.is_system} />
            </div>
            <div>
              <Label>Bezeichnung</Label>
              <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div>
              <Label>Kategorie</Label>
              <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v as WageTypeCategory })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_LABELS) as WageTypeCategory[]).map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Berechnungsart</Label>
              <Select value={editing.amount_type} onValueChange={(v) => setEditing({ ...editing, amount_type: v as AmountType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fester Betrag (€)</SelectItem>
                  <SelectItem value="percentage">Prozent (%)</SelectItem>
                  <SelectItem value="hourly">Stundensatz (€/h)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Default-Betrag</Label>
              <Input type="number" step="0.01" value={editing.default_amount ?? 0} onChange={(e) => setEditing({ ...editing, default_amount: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Pauschalsteuer (%)</Label>
              <Input type="number" step="0.01" value={editing.pauschal_tax_rate ?? 0} onChange={(e) => setEditing({ ...editing, pauschal_tax_rate: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>SKR03 Konto</Label>
              <Input value={editing.account_skr03 ?? ""} onChange={(e) => setEditing({ ...editing, account_skr03: e.target.value })} />
            </div>
            <div>
              <Label>SKR04 Konto</Label>
              <Input value={editing.account_skr04 ?? ""} onChange={(e) => setEditing({ ...editing, account_skr04: e.target.value })} />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>Steuerpflichtig</Label>
              <Switch checked={!!editing.is_taxable} onCheckedChange={(v) => setEditing({ ...editing, is_taxable: v })} />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>SV-pflichtig</Label>
              <Switch checked={!!editing.is_sv_relevant} onCheckedChange={(v) => setEditing({ ...editing, is_sv_relevant: v })} />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3 col-span-2">
              <Label>Aktiv</Label>
              <Switch checked={!!editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
            </div>
            <div className="col-span-2">
              <Label>Beschreibung / Rechtsgrundlage</Label>
              <Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
