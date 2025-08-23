import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Employee } from "@/types/employee";
import { TimeEntry, TimeEntryType, TIME_ENTRY_LABELS, TIME_ENTRY_COLORS } from "@/types/time-tracking";
import { useTimeTracking } from "@/hooks/use-time-tracking";
import { format, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { Clock, Plus, Edit, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface EmployeeCalendarProps {
  employee: Employee;
  onBack: () => void;
  onBulkEntry: () => void;
}

export function EmployeeCalendar({ employee, onBack, onBulkEntry }: EmployeeCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [entryType, setEntryType] = useState<TimeEntryType>('work');
  const [hoursWorked, setHoursWorked] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [breakTime, setBreakTime] = useState('');
  const [notes, setNotes] = useState('');

  const {
    getTimeEntryForDate,
    getTimeEntriesForEmployee,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    calculateEmployeeStatus
  } = useTimeTracking();

  const currentMonth = selectedDate ? selectedDate : new Date();
  const startOfCurrentMonth = startOfMonth(currentMonth);
  const endOfCurrentMonth = endOfMonth(currentMonth);
  
  const monthEntries = getTimeEntriesForEmployee(employee.id, startOfCurrentMonth, endOfCurrentMonth);
  const employeeStatus = calculateEmployeeStatus(employee.id, startOfCurrentMonth, endOfCurrentMonth);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      const existingEntry = getTimeEntryForDate(employee.id, date);
      if (existingEntry) {
        setEditingEntry(existingEntry);
        setEntryType(existingEntry.type);
        setHoursWorked(existingEntry.hoursWorked?.toString() || '');
        setStartTime(existingEntry.startTime || '');
        setEndTime(existingEntry.endTime || '');
        setBreakTime(existingEntry.breakTime?.toString() || '');
        setNotes(existingEntry.notes || '');
      } else {
        setEditingEntry(null);
        setEntryType('work');
        setHoursWorked('8');
        setStartTime('09:00');
        setEndTime('17:00');
        setBreakTime('60');
        setNotes('');
      }
      setShowEntryDialog(true);
    }
  };

  const handleSaveEntry = () => {
    if (!selectedDate) return;

    const entryData = {
      employeeId: employee.id,
      date: selectedDate,
      type: entryType,
      hoursWorked: entryType === 'work' ? parseFloat(hoursWorked) || undefined : undefined,
      startTime: entryType === 'work' ? startTime : undefined,
      endTime: entryType === 'work' ? endTime : undefined,
      breakTime: entryType === 'work' ? parseInt(breakTime) || undefined : undefined,
      notes: notes || undefined
    };

    if (editingEntry) {
      updateTimeEntry(editingEntry.id, entryData);
      toast({
        title: "Eintrag aktualisiert",
        description: `Zeiterfassung für ${format(selectedDate, 'dd.MM.yyyy')} wurde aktualisiert.`
      });
    } else {
      addTimeEntry(entryData);
      toast({
        title: "Eintrag erstellt",
        description: `Zeiterfassung für ${format(selectedDate, 'dd.MM.yyyy')} wurde erstellt.`
      });
    }

    setShowEntryDialog(false);
  };

  const handleDeleteEntry = () => {
    if (editingEntry) {
      deleteTimeEntry(editingEntry.id);
      toast({
        title: "Eintrag gelöscht",
        description: `Zeiterfassung für ${format(selectedDate, 'dd.MM.yyyy')} wurde gelöscht.`
      });
      setShowEntryDialog(false);
    }
  };

  const getDateContent = (date: Date) => {
    const entry = getTimeEntryForDate(employee.id, date);
    if (!entry) return null;

    return (
      <div className={cn("text-xs p-1 rounded-sm border", TIME_ENTRY_COLORS[entry.type])}>
        {entry.type === 'work' && entry.hoursWorked ? `${entry.hoursWorked}h` : TIME_ENTRY_LABELS[entry.type]}
      </div>
    );
  };

  const getStatusBadge = (status: 'green' | 'yellow' | 'red') => {
    const colors = {
      green: 'bg-green-100 text-green-800 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      red: 'bg-red-100 text-red-800 border-red-200'
    };
    
    const labels = {
      green: 'Normal',
      yellow: 'Achtung',
      red: 'Kritisch'
    };

    return (
      <Badge className={colors[status]} variant="outline">
        {labels[status]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Zeiterfassung - ${employee.personalData.firstName} ${employee.personalData.lastName}`}
        onBack={onBack}
      />
      <p className="text-muted-foreground mb-4">{format(currentMonth, 'MMMM yyyy')}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Arbeitszeit-Kalender
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkEntry}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Massenerfassung
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              month={currentMonth}
              onMonthChange={setSelectedDate}
              className="rounded-md border pointer-events-auto"
              components={{
                DayContent: ({ date }) => (
                  <div className="relative w-full h-full">
                    <span>{date.getDate()}</span>
                    {getDateContent(date)}
                  </div>
                )
              }}
            />
          </CardContent>
        </Card>

        {/* Status & Summary */}
        <div className="space-y-4">
          {/* Monthly Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Status
                {getStatusBadge(employeeStatus.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Soll-Stunden</p>
                  <p className="font-medium">{employeeStatus.contractHours.toFixed(1)}h</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ist-Stunden</p>
                  <p className="font-medium">{employeeStatus.actualHours.toFixed(1)}h</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Abweichung</p>
                  <p className={cn("font-medium", {
                    "text-green-600": Math.abs(employeeStatus.deviation) <= 5,
                    "text-yellow-600": Math.abs(employeeStatus.deviation) > 5 && Math.abs(employeeStatus.deviation) <= 10,
                    "text-red-600": Math.abs(employeeStatus.deviation) > 10
                  })}>
                    {employeeStatus.deviation > 0 ? '+' : ''}{employeeStatus.deviation.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Überstunden</p>
                  <p className="font-medium">{employeeStatus.overtimeHours.toFixed(1)}h</p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Krankheitstage</p>
                    <p className="font-medium">{employeeStatus.sickDays}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Urlaubstage</p>
                    <p className="font-medium">{employeeStatus.vacationDays}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Entries */}
          <Card>
            <CardHeader>
              <CardTitle>Letzte Einträge</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {monthEntries.slice(-5).reverse().map((entry) => (
                  <div key={entry.id} className="flex justify-between items-center text-sm">
                    <span>{format(entry.date, 'dd.MM.')}</span>
                    <Badge className={TIME_ENTRY_COLORS[entry.type]} variant="outline">
                      {entry.type === 'work' && entry.hoursWorked 
                        ? `${entry.hoursWorked}h` 
                        : TIME_ENTRY_LABELS[entry.type]
                      }
                    </Badge>
                  </div>
                ))}
                {monthEntries.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    Keine Einträge für diesen Monat
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Entry Dialog */}
      <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? 'Eintrag bearbeiten' : 'Neuer Eintrag'} - {selectedDate && format(selectedDate, 'dd.MM.yyyy')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="entryType">Typ</Label>
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

            {entryType === 'work' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Beginn</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">Ende</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hoursWorked">Arbeitsstunden</Label>
                    <Input
                      id="hoursWorked"
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={hoursWorked}
                      onChange={(e) => setHoursWorked(e.target.value)}
                      placeholder="8.0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="breakTime">Pause (Min.)</Label>
                    <Input
                      id="breakTime"
                      type="number"
                      min="0"
                      value={breakTime}
                      onChange={(e) => setBreakTime(e.target.value)}
                      placeholder="60"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="notes">Notizen</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optionale Notizen..."
                rows={3}
              />
            </div>

            <div className="flex justify-between gap-3">
              {editingEntry && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteEntry}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Löschen
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => setShowEntryDialog(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleSaveEntry}>
                  {editingEntry ? 'Aktualisieren' : 'Speichern'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}