import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Clock, Send, Zap } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export function AutomationIntegrationsTab() {
  const [zapierWebhook, setZapierWebhook] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTriggerZapier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zapierWebhook) {
      alert("Bitte geben Sie Ihre Zapier Webhook-URL ein");
      return;
    }
    setIsLoading(true);
    try {
      await fetch(zapierWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "no-cors",
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          triggered_from: window.location.origin,
          event_type: "payroll_automation_test",
          data: {
            employees_processed: 15,
            total_amount: 45600,
            period: format(new Date(), 'MMMM yyyy', { locale: de })
          }
        }),
      });
      alert("Zapier-Webhook wurde ausgelöst. Prüfen Sie Ihre Zap-Historie für Bestätigung.");
    } catch (error) {
      console.error("Error triggering webhook:", error);
      alert("Fehler beim Auslösen des Zapier-Webhooks. Bitte prüfen Sie die URL.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Zapier Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Verbinden Sie Ihr Lohnsystem mit über 5.000 Apps über Zapier.
              Erstellen Sie automatische Workflows für Buchhaltung, HR-Tools und mehr.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleTriggerZapier} className="space-y-4">
            <div>
              <Label htmlFor="zapier-webhook">Zapier Webhook URL</Label>
              <Input
                id="zapier-webhook"
                type="url"
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                value={zapierWebhook}
                onChange={(e) => setZapierWebhook(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Erstellen Sie einen Zap mit einem Webhook-Trigger und fügen Sie die URL hier ein.
              </p>
            </div>

            <Button type="submit" disabled={isLoading || !zapierWebhook}>
              {isLoading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Webhook wird ausgelöst...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Test-Webhook senden
                </>
              )}
            </Button>
          </form>

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Beliebte Zapier-Integrationen:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div>• Lohnabrechnungen → Google Drive</div>
              <div>• Neue Mitarbeiter → Slack Benachrichtigung</div>
              <div>• DATEV-Export → E-Mail an Steuerberater</div>
              <div>• Compliance-Alerts → Microsoft Teams</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weitere Integrationen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Microsoft Office 365', desc: 'E-Mail, Calendar, Teams' },
              { name: 'Slack', desc: 'Team-Benachrichtigungen' },
              { name: 'Google Workspace', desc: 'Drive, Sheets, Calendar' },
            ].map(integration => (
              <div key={integration.name} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <h4 className="font-medium">{integration.name}</h4>
                  <p className="text-sm text-muted-foreground">{integration.desc}</p>
                </div>
                <Badge variant="outline">Verfügbar</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
