import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { useEmployeeWageTypes, useWageTypes } from "@/hooks/use-wage-types";
import { CATEGORY_LABELS } from "@/types/wage-types";

interface Props { employeeId: string }

export function EmployeeWageTypesCard({ employeeId }: Props) {
  const { wageTypes } = useWageTypes();
  const { items, loading, add, remove } = useEmployeeWageTypes(employeeId);
  const [open, setOpen] = useState(false);
  const [wageTypeId, setWageTypeId] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [validFrom, setValidFrom] = useState<string>(new Date().toISOString().slice(0, 10));
  const [validTo, setValidTo] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const handleAdd = async () => {
    if (!wageTypeId) return;
    await add({
      wage_type_id: wageTypeId,
      amount,
      valid_from: validFrom,
      valid_to: validTo || null,
      notes: notes || null,
      is_active: true,
    });
    setOpen(false);
    setWageTypeId(""); setAmount(0); setNotes(""); setValidTo("");
  };

  const activeWageTypes = wageTypes.filter(w => w.is_active);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Wiederkehrende Lohnarten</CardTitle>
          <CardDescription>Bezüge & Abzüge, die jeden Monat automatisch berücksichtigt werden</CardDescription>
        </div>
        <Button size="sm" onClick={() => setOpen(true)} disabled={activeWageTypes.length === 0}>
          <Plus className="h-4 w-4 mr-2" /> Hinzufügen
        </Button>
      </CardHeader>
      <CardContent>
        {activeWageTypes.length === 0 && (
          <p className="text-sm text-muted-foreground">Bitte zuerst im Lohnarten-Katalog (Einstellungen → Lohnarten) Einträge anlegen.</p>
        )}
        {loading ? (
          <p className="text-sm text-muted-foreground">Lade...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine wiederkehrenden Lohnarten zugeordnet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lohnart</TableHead>
                <TableHead>Kategorie</TableHead>
                <TableHead>Betrag</TableHead>
                <TableHead>Gültig ab</TableHead>
                <TableHead>Gültig bis</TableHead>
                <TableHead>Notiz</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell>{it.wage_type?.name ?? "—"}</TableCell>
                  <TableCell>{it.wage_type ? <Badge variant="secondary">{CATEGORY_LABELS[it.wage_type.category]}</Badge> : "—"}</TableCell>
                  <TableCell>{Number(it.amount).toFixed(2)} €</TableCell>
                  <TableCell>{it.valid_from}</TableCell>
                  <TableCell>{it.valid_to ?? "unbefristet"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{it.notes ?? ""}</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => remove(it.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lohnart zuordnen</DialogTitle>
            <DialogDescription>Wiederkehrender Bezug oder Abzug für diesen Mitarbeiter.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Lohnart</Label>
              <Select value={wageTypeId} onValueChange={(v) => {
                setWageTypeId(v);
                const wt = activeWageTypes.find(w => w.id === v);
                if (wt) setAmount(wt.default_amount);
              }}>
                <SelectTrigger><SelectValue placeholder="Bitte wählen…" /></SelectTrigger>
                <SelectContent>
                  {activeWageTypes.map((wt) => (
                    <SelectItem key={wt.id} value={wt.id}>
                      {wt.code} — {wt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Betrag (€)</Label>
                <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <Label>Gültig ab</Label>
                <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
              </div>
              <div>
                <Label>Gültig bis (optional)</Label>
                <Input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Notiz (z.B. Aktenzeichen Pfändung)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button onClick={handleAdd} disabled={!wageTypeId}>Zuordnen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
