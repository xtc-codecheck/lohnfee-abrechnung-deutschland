import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Plus, Settings, FileText, Database, Shield, Clock } from "lucide-react";

export function SystemEnhancementProposal() {
  const enhancements = [
    {
      category: "Erweiterte Steuerberechnung",
      priority: "Hoch",
      items: [
        {
          title: "Besondere Lohnsteuertabelle",
          description: "Implementation für Beamte, Richter, Berufssoldaten und privat Krankenversicherte",
          status: "geplant",
          fields: ["Beamtenstatus", "Pensionsberechtigung", "Beihilfeberechtigung"]
        },
        {
          title: "Kirchensteuer-Verwaltung",
          description: "Detaillierte Verwaltung nach Bundesländern (8% vs 9%)",
          status: "erweitert",
          fields: ["Konfession", "Kirchensteuerpflicht", "Austritt/Eintritt Datum"]
        },
        {
          title: "Freibetrag-Management",
          description: "Individuelle Freibeträge und Hinzurechnungsbeträge",
          status: "fehlend",
          fields: ["Persönliche Freibeträge", "Hinzurechnungsbeträge", "Gültigkeitszeitraum"]
        }
      ]
    },
    {
      category: "Sozialversicherung",
      priority: "Hoch", 
      items: [
        {
          title: "Krankenkassen-Integration",
          description: "Automatische Abfrage der aktuellen Zusatzbeiträge",
          status: "fehlend",
          fields: ["Krankenkasse", "Zusatzbeitragssatz", "Automatische Updates"]
        },
        {
          title: "Befreiungen & Ermäßigungen",
          description: "Verwaltung von SV-Befreiungen (z.B. Minijob-RV-Befreiung)",
          status: "teilweise",
          fields: ["RV-Befreiung Minijob", "Private KV/PV", "Ausländische SV"]
        },
        {
          title: "Beitragsbemessungsgrenzen",
          description: "Automatische jährliche Aktualisierung der BBG",
          status: "statisch",
          fields: ["BBG-Historie", "Automatische Updates", "Ost/West Unterscheidung"]
        }
      ]
    },
    {
      category: "Arbeitszeit & Zuschläge",
      priority: "Mittel",
      items: [
        {
          title: "Flexible Arbeitszeiten",
          description: "Gleitzeit, Vertrauensarbeitszeit, Schichtmodelle",
          status: "fehlend",
          fields: ["Arbeitszeitmodell", "Kernarbeitszeit", "Gleitzeitrahmen", "Überstunden-Regelung"]
        },
        {
          title: "Branchenzuschläge",
          description: "Spezielle Zuschläge je nach Branche/Tarifvertrag",
          status: "fehlend", 
          fields: ["Tarifvertrag", "Lohngruppe", "Branchenzuschläge", "Erschwerniszulagen"]
        },
        {
          title: "Reisekosten & Spesen",
          description: "Automatische Berechnung von Reisekosten und Spesen",
          status: "fehlend",
          fields: ["Reisetyp", "Entfernung", "Verpflegungsmehraufwand", "Übernachtungskosten"]
        }
      ]
    },
    {
      category: "Compliance & Meldewesen",
      priority: "Hoch",
      items: [
        {
          title: "ELSTER-Integration",
          description: "Automatische Übermittlung der Lohnsteuer-Anmeldungen",
          status: "fehlend",
          fields: ["ELSTER-Zertifikat", "Betriebsnummer", "Automatische Übermittlung"]
        },
        {
          title: "Sozialversicherungs-Meldungen",
          description: "DEÜV-Meldungen, An-/Abmeldungen bei den Krankenkassen",
          status: "fehlend",
          fields: ["DEÜV-Daten", "Krankenkassen-Schnittstelle", "Meldezeiträume"]
        },
        {
          title: "Jahresabschluss",
          description: "Lohnsteuerbescheinigungen, Sozialversicherungsnachweise",
          status: "fehlend",
          fields: ["Jahres-Lohnsteuerbescheinigung", "SV-Nachweis", "Archivierung"]
        }
      ]
    },
    {
      category: "Datenmanagement",
      priority: "Mittel",
      items: [
        {
          title: "Historien-Verwaltung",
          description: "Vollständige Historie aller Änderungen und Korrekturen",
          status: "teilweise",
          fields: ["Änderungshistorie", "Korrektur-Abrechnungen", "Audit-Trail"]
        },
        {
          title: "Import/Export",
          description: "DATEV-Import/Export, Excel-Import für Massendaten",
          status: "fehlend",
          fields: ["DATEV-Schnittstelle", "Excel-Import", "Backup/Restore"]
        },
        {
          title: "Multi-Mandanten",
          description: "Verwaltung mehrerer Unternehmen in einem System",
          status: "fehlend",
          fields: ["Mandanten-Trennung", "Benutzer-Rechte", "Stammdaten pro Mandant"]
        }
      ]
    },
    {
      category: "Automatisierung",
      priority: "Niedrig",
      items: [
        {
          title: "Workflow-Engine",
          description: "Automatische Genehmigungsprozesse für Abrechnungen",
          status: "fehlend",
          fields: ["Genehmigungsstufen", "E-Mail-Benachrichtigungen", "Eskalation"]
        },
        {
          title: "Kalender-Integration",
          description: "Automatische Berücksichtigung von Feiertagen und Urlaubstagen",
          status: "fehlend",
          fields: ["Bundesland-Feiertage", "Betriebskalender", "Urlaubsplanung"]
        },
        {
          title: "Reporting & Analytics",
          description: "Erweiterte Berichte und Kennzahlen-Dashboards",
          status: "grundlegend",
          fields: ["KPI-Dashboard", "Custom Reports", "Trend-Analysen"]
        }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implementiert': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'erweitert': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'teilweise': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'geplant': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'fehlend': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'statisch': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'grundlegend': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'implementiert': return <CheckCircle2 className="h-4 w-4" />;
      case 'erweitert': return <Settings className="h-4 w-4" />;
      case 'teilweise': return <AlertTriangle className="h-4 w-4" />;
      case 'geplant': return <Clock className="h-4 w-4" />;
      case 'fehlend': return <Plus className="h-4 w-4" />;
      case 'statisch': return <Database className="h-4 w-4" />;
      case 'grundlegend': return <FileText className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Hoch': return 'border-l-red-500 bg-red-50 dark:bg-red-950';
      case 'Mittel': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950';  
      case 'Niedrig': return 'border-l-green-500 bg-green-50 dark:bg-green-950';
      default: return 'border-l-gray-500 bg-gray-50 dark:bg-gray-950';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">System-Erweiterungs-Vorschläge</h2>
        <p className="text-muted-foreground">
          Empfohlene Ergänzungen für ein vollautomatisiertes Lohnverarbeitungssystem
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Wichtiger Hinweis:</strong> Minijob- und Midijob-Berechnungen sind als Auswahloption verfügbar, 
          erfordern jedoch explizite Aktivierung. Standardmäßig erfolgt die Berechnung nach der allgemeinen Lohnsteuertabelle.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        {enhancements.map((category, categoryIndex) => (
          <Card 
            key={categoryIndex}
            className={`shadow-card border-l-4 ${getPriorityColor(category.priority)}`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{category.category}</CardTitle>
                <Badge variant="outline" className="font-medium">
                  Priorität: {category.priority}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {category.items.map((item, itemIndex) => (
                  <div 
                    key={itemIndex}
                    className="border border-border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{item.title}</h4>
                          <Badge className={`${getStatusColor(item.status)} flex items-center gap-1`}>
                            {getStatusIcon(item.status)}
                            {item.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium mb-2">Erforderliche Felder:</h5>
                      <div className="flex flex-wrap gap-2">
                        {item.fields.map((field, fieldIndex) => (
                          <Badge 
                            key={fieldIndex} 
                            variant="secondary"
                            className="text-xs"
                          >
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card border-primary">
        <CardHeader>
          <CardTitle className="text-lg text-primary">Zusammenfassung der Empfehlungen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 border border-border rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {enhancements.filter(cat => cat.priority === 'Hoch').length}
              </div>
              <p className="text-sm text-muted-foreground">Hohe Priorität</p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {enhancements.filter(cat => cat.priority === 'Mittel').length}
              </div>
              <p className="text-sm text-muted-foreground">Mittlere Priorität</p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {enhancements.filter(cat => cat.priority === 'Niedrig').length}
              </div>
              <p className="text-sm text-muted-foreground">Niedrige Priorität</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}