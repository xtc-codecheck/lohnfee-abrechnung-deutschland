import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail } from "lucide-react";

export function AutomationEmailTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>E-Mail-Versand-System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              <strong>SMTP konfiguriert:</strong> Ausgehende E-Mails werden über den
              konfigurierten SMTP-Server versendet. Letzter Test: Erfolgreich.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>E-Mail-Provider</Label>
              <Select defaultValue="smtp">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="smtp">SMTP</SelectItem>
                  <SelectItem value="sendgrid">SendGrid</SelectItem>
                  <SelectItem value="office365">Office 365</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Absender-E-Mail</Label>
              <Input value="lohnabrechnung@unternehmen.de" readOnly />
            </div>
          </div>

          <div>
            <Label>Standard E-Mail-Vorlage für Lohnabrechnung</Label>
            <Textarea
              defaultValue={`Sehr geehrte/r [VORNAME] [NACHNAME],

anbei erhalten Sie Ihre Lohnabrechnung für [MONAT] [JAHR].

Mit freundlichen Grüßen
Ihr HR-Team`}
              className="min-h-[120px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">E-Mails heute</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">15</div>
                <p className="text-xs text-muted-foreground">Lohnabrechnungen</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Warteschlange</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Ausstehend</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Fehlerrate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">0%</div>
                <p className="text-xs text-muted-foreground">Letzte 30 Tage</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
