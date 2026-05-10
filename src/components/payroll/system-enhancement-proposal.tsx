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
      case 'implementiert': return 'bg-success/10 text-success dark:bg-success dark:text-success/70';
      case 'erweitert': return 'bg-info/10 text-info dark:bg-info dark:text-info/70';
      case 'teilweise': return 'bg-warning/10 text-warning dark:bg-warning dark:text-warning/70';
      case 'geplant': return 'bg-primary/10 text-primary dark:bg-primary dark:text-primary/70';
      case 'fehlend': return 'bg-destructive/10 text-destructive dark:bg-destructive dark:text-destructive/70';
      case 'statisch': return 'bg-warning/10 text-warning dark:bg-warning dark:text-warning/70';
      case 'grundlegend': return 'bg-info/10 text-info dark:bg-info dark:text-info/70';
      default: return 'bg-muted text-foreground dark:bg-secondary dark:text-muted-foreground';
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
      case 'Hoch': return 'border-l-red-500 bg-destructive/10 dark:bg-destructive';
      case 'Mittel': return 'border-l-yellow-500 bg-warning/10 dark:bg-warning';  
      case 'Niedrig': return 'border-l-green-500 bg-success/10 dark:bg-success';
      default: return 'border-l-gray-500 bg-muted dark:bg-muted';
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
              <div className="text-2xl font-bold text-destructive">
                {enhancements.filter(cat => cat.priority === 'Hoch').length}
              </div>
              <p className="text-sm text-muted-foreground">Hohe Priorität</p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <div className="text-2xl font-bold text-warning">
                {enhancements.filter(cat => cat.priority === 'Mittel').length}
              </div>
              <p className="text-sm text-muted-foreground">Mittlere Priorität</p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <div className="text-2xl font-bold text-success">
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