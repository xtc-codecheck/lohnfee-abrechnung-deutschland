import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Employee } from "@/types/employee";
import { TimeEntryType, TIME_ENTRY_LABELS, BulkTimeEntry } from "@/types/time-tracking";
import { useTimeTracking } from "@/hooks/use-time-tracking";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface BulkEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  preselectedEmployee?: string;
}

export function BulkEntryDialog({ 
  open, 
  onOpenChange, 
  employees, 
  preselectedEmployee 
}: BulkEntryDialogProps) {
  const [selectedEmployee, setSelectedEmployee] = useState(preselectedEmployee || "");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [entryType, setEntryType] = useState<TimeEntryType>('work');
  const [hoursPerDay, setHoursPerDay] = useState('8');
  const [excludeWeekends, setExcludeWeekends] = useState(true);
  const [excludeHolidays, setExcludeHolidays] = useState(true);
  const [notes, setNotes] = useState('');

  const { addBulkTimeEntries } = useTimeTracking();

  const handleSave = () => {
    if (!selectedEmployee || !startDate || !endDate) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive"
      });
      return;
    }

    if (endDate < startDate) {
      toast({
        title: "Fehler",
        description: "Das Enddatum muss nach dem Startdatum liegen.",
        variant: "destructive"
      });
      return;
    }

    const bulkEntry: BulkTimeEntry = {
      employeeId: selectedEmployee,
      startDate,
      endDate,
      type: entryType,
      hoursPerDay: entryType === 'work' ? parseFloat(hoursPerDay) : undefined,
      excludeWeekends,
      excludeHolidays,
      notes: notes || undefined
    };

    const createdEntries = addBulkTimeEntries(bulkEntry);
    
    const employee = employees.find(emp => emp.id === selectedEmployee);
    toast({
      title: "Massenerfassung erfolgreich",
      description: `${createdEntries.length} Einträge für ${employee?.personalData.firstName} ${employee?.personalData.lastName} erstellt.`
    });

    // Reset form
    setSelectedEmployee(preselectedEmployee || "");
    setStartDate(undefined);
    setEndDate(undefined);
    setEntryType('work');
    setHoursPerDay('8');
    setExcludeWeekends(true);
    setExcludeHolidays(true);
    setNotes('');
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Massenerfassung von Zeiteinträgen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Employee Selection */}
          <div>
            <Label htmlFor="employee">Mitarbeiter *</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Mitarbeiter auswählen" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.personalData.firstName} {employee.personalData.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Von *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd.MM.yyyy") : "Startdatum"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Bis *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd.MM.yyyy") : "Enddatum"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                    disabled={(date) => startDate ? date < startDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Entry Type */}
          <div>
            <Label htmlFor="entryType">Typ *</Label>
            <Select value={entryType} onValueChange={(value) => setEntryType(value as TimeEntryType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIME_ENTRY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hours per day (only for work) */}
          {entryType === 'work' && (
            <div>
              <Label htmlFor="hoursPerDay">Stunden pro Tag</Label>
              <Input
                id="hoursPerDay"
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(e.target.value)}
                placeholder="8.0"
              />
            </div>
          )}

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="excludeWeekends"
                checked={excludeWeekends}
                onCheckedChange={(checked) => setExcludeWeekends(checked === true)}
              />
              <Label htmlFor="excludeWeekends">Wochenenden ausschließen</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="excludeHolidays"
                checked={excludeHolidays}
                onCheckedChange={(checked) => setExcludeHolidays(checked === true)}
              />
              <Label htmlFor="excludeHolidays">Feiertage ausschließen</Label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optionale Notizen für alle Einträge..."
              rows={3}
            />
          </div>

          {/* Preview */}
          {startDate && endDate && selectedEmployee && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Vorschau:</p>
              <p className="text-sm text-muted-foreground">
                Erstelle {TIME_ENTRY_LABELS[entryType]}-Einträge vom{" "}
                {format(startDate, "dd.MM.yyyy")} bis {format(endDate, "dd.MM.yyyy")}
                {entryType === 'work' && ` mit ${hoursPerDay}h pro Tag`}
                {excludeWeekends && " (ohne Wochenenden)"}
                {excludeHolidays && " (ohne Feiertage)"}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave}>
              Einträge erstellen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}