import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePayrollStorage } from "@/hooks/use-payroll-storage";
import { useToast } from "@/hooks/use-toast";

interface CreatePayrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePayrollDialog({ open, onOpenChange }: CreatePayrollDialogProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const { createPayrollPeriod, payrollPeriods } = usePayrollStorage();
  const { toast } = useToast();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear + i - 1);
  
  const months = [
    { value: "1", label: "Januar" },
    { value: "2", label: "Februar" },
    { value: "3", label: "März" },
    { value: "4", label: "April" },
    { value: "5", label: "Mai" },
    { value: "6", label: "Juni" },
    { value: "7", label: "Juli" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Dezember" },
  ];

  const handleCreate = () => {
    if (!selectedMonth || !selectedYear) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie Monat und Jahr aus.",
        variant: "destructive",
      });
      return;
    }

    const month = parseInt(selectedMonth);
    const year = parseInt(selectedYear);

    // Prüfen, ob bereits eine Abrechnung für diesen Zeitraum existiert
    const existingPeriod = payrollPeriods.find(
      p => p.month === month && p.year === year
    );

    if (existingPeriod) {
      toast({
        title: "Fehler",
        description: "Für diesen Zeitraum existiert bereits eine Abrechnung.",
        variant: "destructive",
      });
      return;
    }

    createPayrollPeriod(year, month);
    
    toast({
      title: "Abrechnung erstellt",
      description: `Neue Abrechnungsperiode für ${months.find(m => m.value === selectedMonth)?.label} ${year} wurde erstellt.`,
    });

    // Dialog schließen und Felder zurücksetzen
    setSelectedMonth("");
    setSelectedYear("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neue Lohnabrechnung erstellen</DialogTitle>
          <DialogDescription>
            Wählen Sie den Abrechnungszeitraum für die monatliche Lohnabrechnung.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="month">Monat</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Monat auswählen" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="year">Jahr</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Jahr auswählen" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleCreate}>
            Abrechnung erstellen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}