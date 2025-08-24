import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ChevronLeft, 
  Download, 
  Upload, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  FileText,
  Building2,
  CreditCard,
  Calendar,
  Settings
} from "lucide-react";
import { useEmployeeStorage } from "@/hooks/use-employee-storage";
import { usePayrollStorage } from "@/hooks/use-payroll-storage";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface AuthoritiesIntegrationProps {
  onBack: () => void;
}

export function AuthoritiesIntegration({ onBack }: AuthoritiesIntegrationProps) {
  const { employees } = useEmployeeStorage();
  const { payrollPeriods, payrollEntries } = usePayrollStorage();
  
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [exports, setExports] = useState<any[]>([]);

  // Mock-Daten für Demo
  const mockDATEVExports = [
    {
      id: '1',
      period: 'Dezember 2024',
      status: 'ready',
      recordCount: 15,
      totalAmount: 45600,
      generatedAt: new Date(),
    },
    {
      id: '2', 
      period: 'November 2024',
      status: 'transmitted',
      recordCount: 15,
      totalAmount: 44800,
      generatedAt: new Date(2024, 10, 25),
    }
  ];

  const mockELSTERSubmissions = [
    {
      id: '1',
      type: 'Lohnsteueranmeldung',
      period: 'Dezember 2024',
      status: 'submitted',
      submittedAt: new Date(),
      transferTicket: 'LST2024120001'
    }
  ];

  const mockSVMessages = [
    {
      id: '1',
      type: 'Jahresmeldung 2024',
      insuranceProvider: 'AOK Bayern',
      status: 'confirmed',
      employeeCount: 8,
      submittedAt: new Date(2024, 11, 15)
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      'ready': 'default',
      'transmitted': 'secondary', 
      'submitted': 'default',
      'confirmed': 'default',
      'pending': 'outline',
      'error': 'destructive'
    } as const;
    
    const labels = {
      'ready': 'Bereit',
      'transmitted': 'Übertragen',
      'submitted': 'Übermittelt', 
      'confirmed': 'Bestätigt',
      'pending': 'Ausstehend',
      'error': 'Fehler'
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        <h1 className="text-3xl font-bold">Behörden-Integration</h1>
      </div>

      {/* Status-Übersicht */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              DATEV-Export
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Bereit</div>
            <p className="text-xs text-muted-foreground">Letzter Export: Heute</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              ELSTER
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Übermittelt</div>
            <p className="text-xs text-muted-foreground">LST-Anmeldung Dez.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Krankenkassen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Aktuell</div>
            <p className="text-xs text-muted-foreground">Alle Meldungen OK</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Arbeitsagentur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">Ausstehend</div>
            <p className="text-xs text-muted-foreground">Kurzarbeit-Abr.</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="datev" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="datev">DATEV-Export</TabsTrigger>
          <TabsTrigger value="elster">ELSTER</TabsTrigger>
          <TabsTrigger value="krankenkassen">Krankenkassen</TabsTrigger>
          <TabsTrigger value="arbeitsagentur">Arbeitsagentur</TabsTrigger>
        </TabsList>

        <TabsContent value="datev" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>DATEV-Export für Steuerberater</CardTitle>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Neuen Export erstellen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Exportperiode</Label>
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Periode auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {payrollPeriods.map(period => (
                          <SelectItem key={period.id} value={period.id}>
                            {format(new Date(period.year, period.month - 1), 'MMMM yyyy', { locale: de })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Format</Label>
                    <Select defaultValue="ascii">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ascii">DATEV ASCII</SelectItem>
                        <SelectItem value="xml">DATEV XML</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Hinweis:</strong> DATEV-Exports werden in der bestehenden Systemlandschaft verwaltet. 
                    Diese Übersicht zeigt den aktuellen Status und ermöglicht die Vorbereitung der Daten.
                  </AlertDescription>
                </Alert>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Periode</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Datensätze</TableHead>
                      <TableHead>Gesamtbetrag</TableHead>
                      <TableHead>Erstellt am</TableHead>
                      <TableHead>Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockDATEVExports.map(exp => (
                      <TableRow key={exp.id}>
                        <TableCell>{exp.period}</TableCell>
                        <TableCell>{getStatusBadge(exp.status)}</TableCell>
                        <TableCell>{exp.recordCount}</TableCell>
                        <TableCell>{formatCurrency(exp.totalAmount)}</TableCell>
                        <TableCell>{format(exp.generatedAt, 'dd.MM.yyyy', { locale: de })}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Download className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="elster" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>ELSTER-Schnittstelle</CardTitle>
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  Lohnsteueranmeldung erstellen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    ELSTER-Zertifikat ist gültig bis 15.06.2025. Automatische Übermittlung ist aktiviert.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Steuernummer</Label>
                    <Input value="123/456/78901" readOnly />
                  </div>
                  <div>
                    <Label>ELSTER-Steuernummer</Label>
                    <Input value="9198/001/12345" readOnly />
                  </div>
                  <div>
                    <Label>Übertragungsweg</Label>
                    <Input value="Automatisch" readOnly />
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Meldungstyp</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Übermittelt am</TableHead>
                      <TableHead>Transfer-Ticket</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockELSTERSubmissions.map(sub => (
                      <TableRow key={sub.id}>
                        <TableCell>{sub.type}</TableCell>
                        <TableCell>{sub.period}</TableCell>
                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                        <TableCell>{format(sub.submittedAt, 'dd.MM.yyyy HH:mm', { locale: de })}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {sub.transferTicket}
                          </code>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="krankenkassen" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Sozialversicherungs-Meldungen</CardTitle>
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  Jahresmeldung erstellen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Betriebsnummer</Label>
                    <Input value="12345678" readOnly />
                  </div>
                  <div>
                    <Label>Übertragungsweg</Label>
                    <Select defaultValue="sv-net">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sv-net">sv.net</SelectItem>
                        <SelectItem value="deuev">DEÜV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Jahresabschluss 2024:</strong> Jahresmeldungen müssen bis 31. Januar 2025 
                    bei den Krankenkassen eingereicht werden.
                  </AlertDescription>
                </Alert>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Meldungstyp</TableHead>
                      <TableHead>Krankenkasse</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Mitarbeiter</TableHead>
                      <TableHead>Übermittelt am</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockSVMessages.map(msg => (
                      <TableRow key={msg.id}>
                        <TableCell>{msg.type}</TableCell>
                        <TableCell>{msg.insuranceProvider}</TableCell>
                        <TableCell>{getStatusBadge(msg.status)}</TableCell>
                        <TableCell>{msg.employeeCount}</TableCell>
                        <TableCell>{format(msg.submittedAt, 'dd.MM.yyyy', { locale: de })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="arbeitsagentur" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Arbeitsagentur-Meldungen</CardTitle>
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  Kurzarbeiter-Abrechnung
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Kurzarbeit-Abrechnung Dezember 2024:</strong> Abgabefrist ist der 31. Januar 2025.
                    Aktuell sind 3 Mitarbeiter in Kurzarbeit erfasst.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Betroffene Mitarbeiter</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">3</div>
                      <p className="text-xs text-muted-foreground">von 15 Mitarbeitern</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Entgeltausfall</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">€8.400</div>
                      <p className="text-xs text-muted-foreground">Dezember 2024</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Kurzarbeitergeld</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">€5.600</div>
                      <p className="text-xs text-muted-foreground">60% / 67%</p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Label>Aktenzeichen Kurzarbeit</Label>
                  <Input value="KUG-2024-12345" readOnly />
                </div>

                <div>
                  <Label>Nachricht an Arbeitsagentur</Label>
                  <Textarea 
                    placeholder="Zusätzliche Informationen zur Kurzarbeiter-Abrechnung..."
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}