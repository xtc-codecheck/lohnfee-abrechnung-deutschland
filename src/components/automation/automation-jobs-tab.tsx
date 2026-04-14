import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Play, Pause, Settings, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface AutomationJob {
  id: string;
  name: string;
  schedule: string;
  isActive: boolean;
  lastRun: Date;
  nextRun: Date;
  employeeCount: number;
  status: string;
}

interface AutomationJobsTabProps {
  jobs: AutomationJob[];
  getStatusBadge: (status: string) => React.ReactNode;
}

export function AutomationJobsTab({ jobs, getStatusBadge }: AutomationJobsTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Automatische Lohnabrechnung</CardTitle>
            <Button>
              <Play className="h-4 w-4 mr-2" />
              Neuen Job erstellen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Name</TableHead>
                <TableHead>Zeitplan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mitarbeiter</TableHead>
                <TableHead>Letzte Ausführung</TableHead>
                <TableHead>Nächste Ausführung</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map(job => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.name}</TableCell>
                  <TableCell>{job.schedule}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {job.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Pause className="h-4 w-4 text-gray-500" />
                      )}
                      {getStatusBadge(job.status)}
                    </div>
                  </TableCell>
                  <TableCell>{job.employeeCount}</TableCell>
                  <TableCell>
                    {format(job.lastRun, 'dd.MM.yyyy HH:mm', { locale: de })}
                  </TableCell>
                  <TableCell>
                    {format(job.nextRun, 'dd.MM.yyyy HH:mm', { locale: de })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Play className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Job-Konfiguration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Job-Name</Label>
              <Input placeholder="z.B. Monatliche Lohnabrechnung" />
            </div>
            <div>
              <Label>Zeitplan</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Zeitplan auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                  <SelectItem value="weekly">Wöchentlich</SelectItem>
                  <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Abteilungen</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Alle Abteilungen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Abteilungen</SelectItem>
                <SelectItem value="it">IT</SelectItem>
                <SelectItem value="verwaltung">Verwaltung</SelectItem>
                <SelectItem value="vertrieb">Vertrieb</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Aktionen</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch defaultChecked />
                <label className="text-sm">Lohnabrechnung berechnen</label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch defaultChecked />
                <label className="text-sm">PDF generieren</label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch defaultChecked />
                <label className="text-sm">E-Mail versenden</label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch />
                <label className="text-sm">DATEV-Export erstellen</label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
