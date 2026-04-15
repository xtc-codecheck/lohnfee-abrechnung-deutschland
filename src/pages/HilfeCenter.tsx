import { useState } from "react";
import { PageSeo } from "@/components/seo/page-seo";
import { LegalLayout } from "@/components/layout/legal-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Search, Users, Calculator, Clock, FileText, Settings, Shield,
  BookOpen, HelpCircle, ArrowLeft, ChevronRight, Lightbulb,
  CheckCircle, AlertTriangle, CreditCard, Building2, UserPlus,
  Download, Mail, Lock, Eye, Pencil, Trash2, CalendarDays
} from "lucide-react";

const categories = [
  {
    id: "erste-schritte",
    title: "Erste Schritte",
    icon: Lightbulb,
    color: "text-amber-500",
    description: "So starten Sie mit LohnPro – einfach erklärt",
    articles: [
      {
        title: "Wie melde ich mich an?",
        content: `So erstellen Sie Ihr Konto – in 3 einfachen Schritten:

1. Öffnen Sie LohnPro und klicken Sie auf "Registrieren"
2. Geben Sie Ihren Namen, Ihre E-Mail-Adresse und ein sicheres Passwort ein
3. Bestätigen Sie Ihre E-Mail-Adresse über den Link, den Sie per E-Mail erhalten

💡 Tipp: Verwenden Sie ein Passwort mit mindestens 8 Zeichen, Groß- und Kleinbuchstaben und einer Zahl.

Nach der Anmeldung landen Sie direkt im Dashboard – Ihrem Startbildschirm.`,
        tags: ["Anmeldung", "Registrierung", "Konto"],
      },
      {
        title: "Was sehe ich im Dashboard?",
        content: `Das Dashboard ist Ihre Startseite. Hier sehen Sie auf einen Blick:

• Wie viele Mitarbeiter Sie haben
• Ob es offene Aufgaben gibt (z.B. fehlende Daten)
• Eine Kurzübersicht Ihrer letzten Abrechnungen

Am linken Rand finden Sie das Menü mit allen Bereichen wie "Mitarbeiter", "Abrechnung" oder "Zeiterfassung".

💡 Tipp: Die "Erste Schritte"-Box im Dashboard zeigt Ihnen, was als Nächstes zu tun ist.`,
        tags: ["Dashboard", "Übersicht", "Start"],
      },
      {
        title: "Wie richte ich meine Firma ein?",
        content: `Bevor Sie Mitarbeiter anlegen, hinterlegen Sie Ihre Firmendaten:

1. Klicken Sie im Menü auf "Einstellungen"
2. Wählen Sie den Reiter "Firmendaten"
3. Füllen Sie aus: Firmenname, Adresse, Betriebsnummer, Steuernummer
4. Optional: Bankverbindung (IBAN, BIC) für die Lohnauszahlung

⚠️ Wichtig: Die Betriebsnummer erhalten Sie von der Bundesagentur für Arbeit. Ohne Betriebsnummer können keine Meldungen erstellt werden.

💡 Wissen Sie die Betriebsnummer nicht? Fragen Sie bei Ihrer Krankenkasse nach – die kann Ihnen helfen.`,
        tags: ["Firmendaten", "Einrichtung", "Betriebsnummer"],
      },
      {
        title: "Was bedeuten die Rollen (Admin, Sachbearbeiter, Leserecht)?",
        content: `In LohnPro gibt es drei Berechtigungsstufen:

👑 Admin – Darf alles: Mitarbeiter anlegen, Abrechnungen erstellen, Einstellungen ändern, andere Benutzer verwalten.

✏️ Sachbearbeiter – Darf Mitarbeiter und Abrechnungen bearbeiten, aber keine Einstellungen oder Benutzer verwalten.

👁️ Leserecht – Darf nur anschauen, nichts ändern. Gut für Prüfer oder Mitarbeiter, die ihre eigenen Daten einsehen.

💡 Als Firmeninhaber sind Sie automatisch Admin. Sie können weitere Benutzer unter "Einstellungen → Benutzerverwaltung" einladen.`,
        tags: ["Rollen", "Berechtigungen", "Admin"],
      },
      {
        title: "Kann ich mehrere Firmen verwalten?",
        content: `Ja! LohnPro unterstützt sogenannte "Mandanten" – das ist der Fachbegriff für separate Firmen im System.

So wechseln Sie zwischen Firmen:
• Klicken Sie oben in der Kopfzeile auf den Firmennamen
• Wählen Sie die gewünschte Firma aus der Liste

Jede Firma hat eigene Mitarbeiter, eigene Abrechnungen und eigene Einstellungen. Die Daten werden niemals vermischt.

💡 Ideal für: Unternehmer mit mehreren Betrieben oder Steuerberater, die mehrere Kunden betreuen.`,
        tags: ["Mandanten", "Mehrere Firmen", "Wechseln"],
      },
    ],
  },
  {
    id: "mitarbeiter",
    title: "Mitarbeiter verwalten",
    icon: Users,
    color: "text-blue-500",
    description: "Mitarbeiter anlegen, bearbeiten und verwalten",
    articles: [
      {
        title: "Wie lege ich einen neuen Mitarbeiter an?",
        content: `Einen neuen Mitarbeiter anlegen geht in 4 Schritten:

📋 Schritt 1 – Persönliche Daten:
Vorname, Nachname, Geburtsdatum, Adresse, Geschlecht

📋 Schritt 2 – Beschäftigungsdaten:
Eintrittsdatum, Abteilung, Position, Arbeitszeit (Vollzeit/Teilzeit), Wochenstunden

📋 Schritt 3 – Gehalt & Steuern:
Bruttogehalt, Steuerklasse (1-6), Steuer-ID, Kirchensteuer (ja/nein), Krankenkasse, SV-Nummer

📋 Schritt 4 – Extras (optional):
Firmenwagen, betriebliche Altersvorsorge (bAV)

💡 Sie müssen nicht alles sofort ausfüllen – Pflichtfelder sind mit * markiert. Den Rest können Sie später ergänzen.

⚠️ Wichtig: Die Steuer-ID finden Sie auf dem Lohnsteuerbescheid des Mitarbeiters. Die SV-Nummer steht auf dem Sozialversicherungsausweis.`,
        tags: ["Mitarbeiter anlegen", "Neueinstellung", "Wizard"],
      },
      {
        title: "Was bedeuten die ganzen Steuer-Begriffe?",
        content: `Hier die wichtigsten Begriffe einfach erklärt:

🔢 Steuerklasse (1-6):
Die Steuerklasse bestimmt, wie viel Lohnsteuer abgezogen wird.
• Klasse 1: Ledige, Geschiedene
• Klasse 2: Alleinerziehende
• Klasse 3: Verheiratet (höheres Einkommen)
• Klasse 4: Verheiratet (beide ähnliches Einkommen)
• Klasse 5: Verheiratet (geringeres Einkommen, Partner hat Klasse 3)
• Klasse 6: Zweitjob

🆔 Steuer-ID: Eine 11-stellige Nummer, die jeder vom Finanzamt bekommt. Ändert sich nie.

📋 SV-Nummer: Die Sozialversicherungsnummer steht auf dem SV-Ausweis. Format: z.B. 12 150785 M 413

💒 Kirchensteuer: Wird nur abgezogen, wenn der Mitarbeiter Mitglied einer Kirche ist (evangelisch oder katholisch).

💡 Unsicher? Fragen Sie den Mitarbeiter nach seinem letzten Gehaltsnachweis – dort stehen alle Daten drauf.`,
        tags: ["Steuerklasse", "Steuer-ID", "SV-Nummer", "Erklärung"],
      },
      {
        title: "Wie ändere ich die Daten eines Mitarbeiters?",
        content: `So bearbeiten Sie Mitarbeiterdaten:

1. Klicken Sie im Menü auf "Mitarbeiter"
2. Finden Sie den Mitarbeiter in der Liste (nutzen Sie die Suche oben)
3. Klicken Sie auf den Namen des Mitarbeiters
4. Klicken Sie auf "Bearbeiten"
5. Ändern Sie die gewünschten Felder
6. Klicken Sie auf "Speichern"

⚠️ Wichtig: Änderungen an Steuerklasse, Gehalt oder Kirchensteuer wirken sich erst auf die nächste Abrechnung aus. Bereits erstellte Abrechnungen bleiben unverändert.

💡 Alle Änderungen werden automatisch protokolliert – so können Sie jederzeit nachvollziehen, wer wann was geändert hat.`,
        tags: ["Bearbeiten", "Ändern", "Stammdaten"],
      },
      {
        title: "Ein Mitarbeiter verlässt die Firma – was muss ich tun?",
        content: `Wenn ein Mitarbeiter austritt:

1. Öffnen Sie das Profil des Mitarbeiters
2. Klicken Sie auf "Bearbeiten"
3. Tragen Sie das Austrittsdatum ein
4. Speichern Sie

Was passiert dann automatisch:
✅ Der Mitarbeiter wird als "inaktiv" markiert
✅ Er erscheint nicht mehr in neuen Abrechnungen
✅ Die bisherigen Daten und Abrechnungen bleiben erhalten

⚠️ Vergessen Sie nicht:
• Die letzte Abrechnung für den Mitarbeiter zu erstellen
• Eine Abmeldung bei der Sozialversicherung zu machen (unter "Meldewesen → SV-Meldungen")
• Am Jahresende die Lohnsteuerbescheinigung zu erstellen

💡 Gelöschte Mitarbeiter können nicht wiederhergestellt werden – nutzen Sie daher immer das Austrittsdatum statt den Mitarbeiter zu löschen.`,
        tags: ["Austritt", "Kündigung", "Deaktivieren"],
      },
      {
        title: "Was bedeutet die Ampel neben dem Mitarbeiternamen?",
        content: `Die Ampel zeigt an, wie vollständig die Daten des Mitarbeiters sind:

🟢 Grün (Score 80-100): Alle wichtigen Daten sind vorhanden. Die Abrechnung kann korrekt durchgeführt werden.

🟡 Gelb (Score 50-79): Einige Daten fehlen oder sind nicht plausibel. Die Abrechnung ist möglich, aber prüfen Sie die markierten Felder.

🔴 Rot (Score 0-49): Wichtige Daten fehlen (z.B. Steuerklasse oder Krankenkasse). Eine korrekte Abrechnung ist nicht möglich.

💡 Klicken Sie auf die Ampel, um zu sehen, welche Daten fehlen oder korrigiert werden müssen.`,
        tags: ["ELStAM", "Ampel", "Datenvollständigkeit"],
      },
    ],
  },
  {
    id: "abrechnung",
    title: "Lohnabrechnung",
    icon: Calculator,
    color: "text-green-500",
    description: "Gehälter berechnen, prüfen und exportieren",
    articles: [
      {
        title: "Wie erstelle ich eine Lohnabrechnung?",
        content: `Eine monatliche Lohnabrechnung erstellen Sie so:

1. Klicken Sie im Menü auf "Abrechnung"
2. Klicken Sie auf "Neue Periode erstellen"
3. Wählen Sie den Monat und das Jahr
4. Klicken Sie auf "Erstellen"

Das System berechnet jetzt automatisch für jeden aktiven Mitarbeiter:
✅ Das Bruttogehalt
✅ Die Lohnsteuer
✅ Den Solidaritätszuschlag
✅ Die Kirchensteuer (falls zutreffend)
✅ Alle Sozialversicherungsbeiträge (Kranken-, Renten-, Arbeitslosen-, Pflegeversicherung)
✅ Das Nettogehalt

💡 Sie müssen nichts selbst berechnen – alles passiert automatisch nach den aktuellen gesetzlichen Vorgaben.

⚠️ Prüfen Sie die Ergebnisse, bevor Sie die Periode abschließen. Nach dem Abschluss kann nur noch eine Korrektur erstellt werden.`,
        tags: ["Abrechnung erstellen", "Monatlich", "Gehalt"],
      },
      {
        title: "Was bedeuten die Abzüge auf der Gehaltsabrechnung?",
        content: `Vom Bruttogehalt werden verschiedene Beträge abgezogen. Hier eine einfache Erklärung:

💰 Lohnsteuer: Der Staat zieht je nach Steuerklasse und Gehaltshöhe Steuern ab. Je höher das Gehalt, desto mehr Steuern.

💰 Solidaritätszuschlag (Soli): Ein Zuschlag auf die Lohnsteuer (5,5%). Fällt bei den meisten Arbeitnehmern seit 2021 weg oder ist stark reduziert.

💰 Kirchensteuer: Nur für Kirchenmitglieder – 8% oder 9% der Lohnsteuer, je nach Bundesland.

💰 Krankenversicherung (KV): Wird zwischen Arbeitnehmer und Arbeitgeber aufgeteilt. Der Beitragssatz beträgt 14,6% + Zusatzbeitrag der jeweiligen Krankenkasse.

💰 Rentenversicherung (RV): 18,6% des Bruttogehalts, jeweils zur Hälfte von Arbeitnehmer und Arbeitgeber.

💰 Arbeitslosenversicherung (AV): 2,6% des Bruttogehalts, jeweils zur Hälfte.

💰 Pflegeversicherung (PV): 3,4% des Bruttogehalts. Kinderlose über 23 zahlen einen Zuschlag.

💡 Was übrig bleibt, ist Ihr Nettogehalt – das wird auf Ihr Konto überwiesen.`,
        tags: ["Abzüge", "Netto", "Brutto", "Erklärung"],
      },
      {
        title: "Wie zahle ich Weihnachtsgeld oder Prämien aus?",
        content: `Sonderzahlungen wie Weihnachtsgeld, Urlaubsgeld oder Prämien erfassen Sie so:

1. Gehen Sie zu "Abrechnung → Sonderzahlungen"
2. Klicken Sie auf "Neue Sonderzahlung"
3. Wählen Sie den Mitarbeiter und die Art der Zahlung
4. Geben Sie den Betrag und den Zeitraum ein
5. Speichern Sie

Das System berechnet automatisch die korrekten Steuern und Sozialversicherungsbeiträge für die Sonderzahlung.

💡 Gut zu wissen:
• Sonderzahlungen werden oft höher besteuert als reguläres Gehalt
• Bei Abfindungen gilt eine spezielle Steuerberechnung (Fünftelregelung)
• Einmalzahlungen in den ersten 3 Monaten des Jahres können dem Vorjahr zugeordnet werden (Märzklausel)`,
        tags: ["Weihnachtsgeld", "Bonus", "Prämie", "Sonderzahlung"],
      },
      {
        title: "Ich habe einen Fehler in der Abrechnung – was tun?",
        content: `Keine Sorge – Fehler können korrigiert werden!

So erstellen Sie eine Korrektur:
1. Öffnen Sie die betroffene Abrechnungsperiode
2. Klicken Sie auf den Mitarbeiter, bei dem der Fehler ist
3. Klicken Sie auf "Korrektur erstellen"
4. Ändern Sie die fehlerhaften Werte
5. Das System berechnet automatisch die Differenz

Was berechnet wird:
✅ Differenz beim Bruttogehalt
✅ Nachzahlung oder Rückforderung bei Steuern
✅ Anpassung der Sozialversicherungsbeiträge

💡 Die Korrektur wird automatisch in der nächsten Abrechnung berücksichtigt.

⚠️ Wichtig: Dokumentieren Sie den Grund der Korrektur im Notizfeld – das ist für die Buchführung wichtig.`,
        tags: ["Korrektur", "Fehler", "Nachberechnung"],
      },
      {
        title: "Was ist der DATEV-Export und brauche ich den?",
        content: `Der DATEV-Export ist eine Funktion, mit der Sie Ihre Abrechnungsdaten an Ihren Steuerberater weitergeben können.

Brauche ich das?
• Wenn Sie einen Steuerberater haben → Ja, sehr praktisch!
• Wenn Sie Ihre Buchhaltung selbst machen → Nützlich für die Steuererklärung
• Wenn Sie gerade erst anfangen → Erstmal nicht nötig

So funktioniert der Export:
1. Gehen Sie zu "Abrechnung"
2. Wählen Sie die abgeschlossene Periode
3. Klicken Sie auf "DATEV-Export"
4. Laden Sie die Datei herunter
5. Senden Sie die Datei an Ihren Steuerberater

💡 Ihr Steuerberater kann die Datei direkt in seine Software einlesen – das spart Zeit und vermeidet Tippfehler.`,
        tags: ["DATEV", "Export", "Steuerberater"],
      },
      {
        title: "Was ist das Lohnkonto und wo finde ich es?",
        content: `Das Lohnkonto ist eine gesetzlich vorgeschriebene Übersicht aller Gehaltszahlungen eines Mitarbeiters pro Jahr.

Dort sehen Sie auf einen Blick:
• Alle monatlichen Bruttogehälter
• Kumulierte Steuern (Lohnsteuer, Soli, Kirchensteuer)
• Kumulierte Sozialversicherungsbeiträge
• Sonderzahlungen

So finden Sie es:
1. Gehen Sie zu "Abrechnung"
2. Klicken Sie auf "Lohnkonto"
3. Wählen Sie den Mitarbeiter und das Jahr

💡 Das Lohnkonto wird bei einer Betriebsprüfung verlangt – gut, dass LohnPro es automatisch führt!`,
        tags: ["Lohnkonto", "Übersicht", "Jahresübersicht"],
      },
    ],
  },
  {
    id: "zeiterfassung",
    title: "Zeiterfassung & Urlaub",
    icon: Clock,
    color: "text-purple-500",
    description: "Arbeitszeiten, Urlaub und Krankheit verwalten",
    articles: [
      {
        title: "Wie erfasse ich Arbeitszeiten?",
        content: `Arbeitszeiten für Ihre Mitarbeiter erfassen Sie so:

1. Klicken Sie im Menü auf "Zeiterfassung"
2. Wählen Sie den Mitarbeiter aus
3. Klicken Sie auf den gewünschten Tag im Kalender
4. Geben Sie ein: Arbeitsbeginn, Arbeitsende, Pause

Die Arbeitsstunden werden automatisch berechnet.

💡 Zeitspar-Tipp: Nutzen Sie die "Massenerfassung" um die gleichen Zeiten für mehrere Mitarbeiter oder Tage auf einmal einzutragen.

Beispiel:
• Start: 08:00 | Ende: 17:00 | Pause: 60 Min
• → Ergebnis: 8 Arbeitsstunden`,
        tags: ["Arbeitszeit", "Stunden", "Erfassen"],
      },
      {
        title: "Wie trage ich Urlaub oder Krankheit ein?",
        content: `Abwesenheiten tragen Sie im Kalender ein:

1. Gehen Sie zu "Zeiterfassung"
2. Wählen Sie den Mitarbeiter
3. Klicken Sie auf den Tag (oder markieren Sie mehrere Tage)
4. Wählen Sie die Art: Urlaub, Krankheit, Feiertag oder Sonstiges
5. Speichern Sie

Bei Krankheit:
• Ab dem 4. Tag brauchen Sie in der Regel ein Attest
• Das System berechnet automatisch die Entgeltfortzahlung (6 Wochen)
• Danach springt die Krankenkasse ein (Krankengeld)

💡 Das System warnt Sie automatisch, wenn ein Mitarbeiter seinen Urlaubsanspruch überschreitet.`,
        tags: ["Urlaub", "Krankheit", "Abwesenheit"],
      },
      {
        title: "Was sind Überstunden und wie werden die berechnet?",
        content: `Überstunden entstehen, wenn ein Mitarbeiter mehr arbeitet als vertraglich vereinbart.

Beispiel:
• Vertrag: 40 Stunden/Woche
• Tatsächlich gearbeitet: 44 Stunden/Woche
• → 4 Überstunden

LohnPro berechnet Überstunden automatisch:
✅ Vergleich Soll-Stunden vs. Ist-Stunden
✅ Anzeige im Arbeitszeitkonto
✅ Übernahme in die Lohnabrechnung (wenn gewünscht)

💡 Sie entscheiden, ob Überstunden ausgezahlt oder als Freizeitausgleich genommen werden.`,
        tags: ["Überstunden", "Mehrarbeit", "Arbeitszeitkonto"],
      },
    ],
  },
  {
    id: "meldewesen",
    title: "Meldungen & Bescheinigungen",
    icon: FileText,
    color: "text-orange-500",
    description: "Pflichtmeldungen an Behörden – verständlich erklärt",
    articles: [
      {
        title: "Was sind SV-Meldungen und wann brauche ich die?",
        content: `SV-Meldungen sind Pflichtmeldungen an die Sozialversicherung. Sie müssen erstellt werden bei:

📝 Anmeldung: Wenn ein neuer Mitarbeiter anfängt
📝 Abmeldung: Wenn ein Mitarbeiter die Firma verlässt
📝 Jahresmeldung: Einmal jährlich für jeden Mitarbeiter (bis 15. Februar)
📝 Unterbrechung: Bei längerer Krankheit oder Elternzeit

So erstellen Sie eine Meldung:
1. Gehen Sie zu "Meldewesen → SV-Meldungen"
2. Klicken Sie auf "Neue Meldung"
3. Wählen Sie den Mitarbeiter und den Meldegrund
4. Das System füllt den Rest automatisch aus
5. Prüfen und absenden

💡 LohnPro erinnert Sie automatisch an fällige Meldungen – Sie verpassen keine Frist!

⚠️ Verspätete Meldungen können zu Bußgeldern führen. Reichen Sie Meldungen immer pünktlich ein.`,
        tags: ["SV-Meldung", "Sozialversicherung", "Pflichtmeldung"],
      },
      {
        title: "Was ist ein Beitragsnachweis?",
        content: `Der Beitragsnachweis ist eine monatliche Aufstellung der Sozialversicherungsbeiträge pro Krankenkasse.

Einfach erklärt: Sie sagen der Krankenkasse, wie viel Geld Sie für Ihre Mitarbeiter überweisen müssen.

So erstellen Sie einen Beitragsnachweis:
1. Gehen Sie zu "Meldewesen → Beitragsnachweise"
2. Klicken Sie auf "Neuen Nachweis erstellen"
3. Wählen Sie Monat, Jahr und Krankenkasse
4. Das System berechnet automatisch alle Beträge:
   • Krankenversicherung (Arbeitnehmer + Arbeitgeber)
   • Rentenversicherung
   • Arbeitslosenversicherung
   • Pflegeversicherung
   • Umlagen (U1, U2, Insolvenzgeldumlage)

💡 Der Beitragsnachweis muss spätestens 2 Tage vor Fälligkeit bei der Krankenkasse sein.`,
        tags: ["Beitragsnachweis", "Krankenkasse", "Monatlich"],
      },
      {
        title: "Was ist eine Lohnsteuerbescheinigung?",
        content: `Die Lohnsteuerbescheinigung ist eine jährliche Zusammenfassung aller Steuerabzüge eines Mitarbeiters. Sie wird benötigt:

• Am Jahresende (für alle Mitarbeiter)
• Bei Austritt eines Mitarbeiters

Der Mitarbeiter braucht diese Bescheinigung für seine Steuererklärung.

So erstellen Sie sie:
1. Gehen Sie zu "Meldewesen → Lohnsteuerbescheinigung"
2. Wählen Sie das Jahr und den Mitarbeiter
3. Klicken Sie auf "Erstellen"
4. Alle Werte werden automatisch aus den Abrechnungen berechnet

Was steht drauf:
• Gesamter Bruttolohn des Jahres
• Einbehaltene Lohnsteuer, Soli, Kirchensteuer
• Sozialversicherungsbeiträge (Arbeitnehmer- UND Arbeitgeberanteile)

💡 LohnPro berechnet alle Zeilen automatisch – Sie müssen nichts selbst zusammenrechnen.`,
        tags: ["Lohnsteuerbescheinigung", "Jahresende", "Steuererklärung"],
      },
    ],
  },
  {
    id: "einstellungen",
    title: "Einstellungen & Sicherheit",
    icon: Settings,
    color: "text-slate-500",
    description: "Firmendaten, Datenschutz und Benutzer verwalten",
    articles: [
      {
        title: "Wie ändere ich meine Firmendaten?",
        content: `Firmendaten können Sie jederzeit aktualisieren:

1. Klicken Sie im Menü auf "Einstellungen"
2. Wählen Sie "Firmendaten"
3. Ändern Sie die gewünschten Felder:
   • Firmenname und Adresse
   • Betriebsnummer
   • Steuernummer und Finanzamt
   • Bankverbindung (IBAN, BIC, Bankname)
   • Kontaktdaten (E-Mail, Telefon)
4. Klicken Sie auf "Speichern"

💡 Diese Daten erscheinen auf Ihren Lohnabrechnungen und Meldungen – halten Sie sie aktuell!`,
        tags: ["Firmendaten", "Ändern", "Einstellungen"],
      },
      {
        title: "Wie lade ich weitere Benutzer ein?",
        content: `Sie können weitere Personen zu LohnPro einladen, z.B. einen Buchhalter oder Assistenten:

1. Gehen Sie zu "Einstellungen → Benutzerverwaltung"
2. Klicken Sie auf "Benutzer hinzufügen"
3. Geben Sie die E-Mail-Adresse ein
4. Wählen Sie die Rolle:
   • Admin: Voller Zugriff
   • Sachbearbeiter: Kann Abrechnungen erstellen
   • Leserecht: Kann nur anschauen

💡 Jeder eingeladene Benutzer bekommt eine E-Mail mit einem Link zur Registrierung.

⚠️ Teilen Sie niemals Ihr eigenes Passwort – erstellen Sie stattdessen einen eigenen Zugang für jede Person.`,
        tags: ["Benutzer", "Einladen", "Zugang"],
      },
      {
        title: "Sind meine Daten sicher?",
        content: `Ja! LohnPro nimmt Datensicherheit sehr ernst:

🔒 Verschlüsselung: Alle Daten werden verschlüsselt übertragen und gespeichert.

🏢 Datentrennung: Jede Firma hat einen eigenen, abgeschotteten Datenbereich. Niemand kann auf Daten anderer Firmen zugreifen.

📋 Protokollierung: Alle Änderungen werden automatisch im Hintergrund protokolliert. So können Sie jederzeit nachvollziehen, wer was geändert hat.

🇪🇺 DSGVO-konform: LohnPro erfüllt die europäischen Datenschutzanforderungen. Sie können jederzeit eine Datenauskunft, Löschung oder Berichtigung beantragen.

💡 Unter "Einstellungen → DSGVO" können Sie Datenschutzanfragen verwalten.`,
        tags: ["Sicherheit", "Datenschutz", "DSGVO", "Verschlüsselung"],
      },
      {
        title: "Wie ändere ich mein Passwort?",
        content: `So ändern Sie Ihr Passwort:

1. Gehen Sie zur Anmeldeseite
2. Klicken Sie auf "Passwort vergessen?"
3. Geben Sie Ihre E-Mail-Adresse ein
4. Sie erhalten eine E-Mail mit einem Link zum Zurücksetzen
5. Wählen Sie ein neues, sicheres Passwort

💡 Ein sicheres Passwort hat:
• Mindestens 8 Zeichen
• Groß- und Kleinbuchstaben
• Mindestens eine Zahl
• Am besten auch ein Sonderzeichen (z.B. ! @ # $)

⚠️ Verwenden Sie nicht das gleiche Passwort wie für andere Dienste!`,
        tags: ["Passwort", "Sicherheit", "Zurücksetzen"],
      },
    ],
  },
  {
    id: "branchenmodule",
    title: "Branchenmodule",
    icon: Building2,
    color: "text-teal-500",
    description: "Spezielle Funktionen für Bau, Gastronomie und Pflege",
    articles: [
      {
        title: "Bau-Branche: Was ist Baulohn?",
        content: `Wenn Sie ein Bauunternehmen betreiben, gibt es besondere Regeln für die Lohnabrechnung:

🏗️ SOKA-BAU: Die Sozialkasse der Bauwirtschaft erhebt zusätzliche Beiträge für Urlaubsgeld und Zusatzversorgung Ihrer Mitarbeiter.

LohnPro berechnet automatisch:
✅ SOKA-BAU Urlaubskassenbeitrag
✅ SOKA-BAU Zusatzversorgungsbeitrag
✅ Winterbau-Umlage
✅ 13. Monatseinkommen (Bau-Tarif)

💡 Aktivieren Sie das Bau-Modul unter "Abrechnung → Branchenmodule", um diese Berechnungen zu nutzen.`,
        tags: ["Bau", "Baulohn", "SOKA-BAU"],
      },
      {
        title: "Gastronomie: Trinkgeld und Sachbezüge",
        content: `In der Gastronomie gibt es Besonderheiten bei der Abrechnung:

🍽️ Sachbezugswerte für Mahlzeiten (2025):
• Frühstück: 2,17 € pro Tag
• Mittag-/Abendessen: 4,13 € pro Tag
→ Diese Beträge werden zum Gehalt hinzugerechnet und versteuert

💰 Trinkgeld:
• Freiwilliges Trinkgeld direkt vom Gast → steuerfrei!
• Vom Arbeitgeber festgelegtes Trinkgeld → steuerpflichtig

LohnPro berechnet die Sachbezüge automatisch basierend auf den Arbeitstagen.

💡 Tipp: Führen Sie ein Trinkgeldbuch, um die Steuerfreiheit nachweisen zu können.`,
        tags: ["Gastronomie", "Trinkgeld", "Sachbezüge", "Mahlzeiten"],
      },
      {
        title: "Pflege: Steuerfreie Zuschläge",
        content: `Im Pflegebereich gibt es steuerfreie Zuschläge für besondere Arbeitszeiten:

🌙 Nachtzuschlag (20:00-06:00): bis 25% steuerfrei
🌅 Sonntagszuschlag: bis 50% steuerfrei
🎄 Feiertagszuschlag: bis 125% steuerfrei
🎆 Silvester/Neujahr/Weihnachten: bis 150% steuerfrei

LohnPro berechnet die Zuschläge automatisch anhand der erfassten Arbeitszeiten und prüft die steuerfreien Grenzen.

💡 Wichtig: Die Steuerfreiheit gilt nur bis zu einem Grundlohn von 50 €/Stunde. Darüber hinausgehende Zuschläge werden normal versteuert.`,
        tags: ["Pflege", "Nachtzuschlag", "SFN-Zuschläge", "Steuerfrei"],
      },
    ],
  },
  {
    id: "berichte",
    title: "Berichte & Auswertungen",
    icon: Download,
    color: "text-indigo-500",
    description: "Übersichten, Exporte und Auswertungen erstellen",
    articles: [
      {
        title: "Welche Berichte kann ich erstellen?",
        content: `LohnPro bietet verschiedene Auswertungen:

📊 Lohnkostenübersicht: Was kosten Ihre Mitarbeiter insgesamt? Brutto, Netto, Arbeitgeberanteile.

📊 Mitarbeiterstatistik: Wie viele Mitarbeiter haben Sie? Vollzeit, Teilzeit, Abteilungsverteilung.

📊 Steuer- und SV-Bericht: Alle Steuern und Sozialversicherungsbeiträge auf einen Blick.

📊 Krankheits- und Urlaubsübersicht: Wer war wie lange krank? Wie viel Resturlaub hat jeder?

📊 Audit-Bericht: Welche Änderungen wurden wann von wem vorgenommen?

So erstellen Sie einen Bericht:
1. Gehen Sie zu "Berichte"
2. Wählen Sie den gewünschten Berichtstyp
3. Filtern Sie nach Zeitraum, Abteilung oder Mitarbeiter
4. Klicken Sie auf "Export" um den Bericht herunterzuladen

💡 Berichte können als PDF oder CSV (für Excel) exportiert werden.`,
        tags: ["Berichte", "Auswertungen", "Export", "Statistik"],
      },
      {
        title: "Was ist der GoBD-Export?",
        content: `GoBD steht für "Grundsätze zur ordnungsmäßigen Führung und Aufbewahrung von Büchern" – klingt kompliziert, ist aber einfach erklärt:

Wenn das Finanzamt eine Betriebsprüfung macht, müssen Sie Ihre Buchführungsdaten in einem bestimmten Format vorlegen können.

Der GoBD-Export erstellt genau dieses Format:
✅ Alle Abrechnungsdaten
✅ Alle Änderungsprotokolle
✅ In einem prüfungsfähigen Format

So erstellen Sie den Export:
1. Gehen Sie zu "Berichte"
2. Wählen Sie "GoBD-Export"
3. Wählen Sie den Zeitraum
4. Laden Sie die Datei herunter

💡 Speichern Sie den GoBD-Export regelmäßig (z.B. am Jahresende) auf einem sicheren Speichermedium. Aufbewahrungspflicht: 10 Jahre!`,
        tags: ["GoBD", "Betriebsprüfung", "Finanzamt", "Aufbewahrung"],
      },
      {
        title: "Wie lade ich eine Entgeltabrechnung als PDF herunter?",
        content: `Für jeden Mitarbeiter kann eine druckfertige PDF-Entgeltabrechnung erstellt werden:

1. Gehen Sie zu "Abrechnung → Lohnjournal"
2. Suchen Sie den gewünschten Mitarbeiter und Monat
3. Klicken Sie auf das PDF-Symbol (📄) in der Zeile des Mitarbeiters
4. Die PDF wird automatisch heruntergeladen

Die PDF enthält:
✅ Mitarbeiterdaten (Name, Steuerklasse, SV-Nummer)
✅ Arbeitszeiten (Ist- und Soll-Stunden, Überstunden, Krankheit)
✅ Bruttobezüge und Zuschläge
✅ Steuerliche Abzüge (Lohnsteuer, Soli, Kirchensteuer)
✅ Sozialversicherungsbeiträge
✅ Den Netto-Auszahlungsbetrag

💡 Tipp: Mit "Alle als PDF" können Sie die Abrechnungen aller Mitarbeiter auf einmal herunterladen.`,
        tags: ["PDF", "Entgeltabrechnung", "Download", "Lohnzettel"],
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Problemlösung",
    icon: AlertTriangle,
    color: "text-red-500",
    description: "Häufige Probleme lösen – Schritt für Schritt",
    articles: [
      {
        title: "Abrechnung zeigt 0 € – was ist los?",
        content: `Wenn die Abrechnung nur Nullwerte anzeigt, prüfen Sie folgendes:

🔍 Schritt 1: Hat der Mitarbeiter ein Bruttogehalt?
→ Öffnen Sie das Mitarbeiterprofil und prüfen Sie unter "Gehaltsdaten", ob ein Bruttogehalt eingetragen ist.

🔍 Schritt 2: Ist der Mitarbeiter aktiv?
→ Prüfen Sie, ob kein Austrittsdatum in der Vergangenheit eingetragen ist.

🔍 Schritt 3: Ist die Steuerklasse gesetzt?
→ Ohne Steuerklasse kann keine Steuer berechnet werden.

🔍 Schritt 4: Wurde die Periode korrekt erstellt?
→ Löschen Sie die Periode und erstellen Sie sie über den Wizard neu.

💡 Die häufigste Ursache: Es fehlt das Bruttogehalt im Mitarbeiterprofil.`,
        tags: ["Fehler", "Nullwerte", "Abrechnung", "Problem"],
      },
      {
        title: "Zeiterfassung wird nicht in die Abrechnung übernommen",
        content: `Der Monats-Wizard nutzt automatisch die Zeiterfassungsdaten. Wenn das nicht klappt:

🔍 Prüfen Sie:
1. Sind Zeiteinträge für den richtigen Monat vorhanden?
2. Sind die Einträge dem richtigen Mitarbeiter zugeordnet?
3. Wurde der Typ korrekt erfasst (Arbeit / Urlaub / Krankheit)?

So testen Sie es:
1. Gehen Sie zu "Zeiterfassung"
2. Wählen Sie den Mitarbeiter
3. Prüfen Sie, ob im gewünschten Monat Einträge erscheinen
4. Erstellen Sie die Abrechnung über "Abrechnung → Monatsabrechnung"

💡 Wenn keine Zeiteinträge vorhanden sind, rechnet das System mit den vertraglichen Standardwerten (Wochenstunden × 4,33).`,
        tags: ["Zeiterfassung", "Synchronisation", "Wizard"],
      },
      {
        title: "DATEV-Export ist leer oder hat keine Daten",
        content: `Der DATEV-Export funktioniert nur, wenn Abrechnungsdaten vorhanden sind.

Checkliste:
1. ✅ Wurde eine Abrechnungsperiode für den Monat erstellt?
2. ✅ Wurden die Abrechnungen berechnet (nicht nur die Periode angelegt)?
3. ✅ Gibt es Einträge im Lohnjournal für diesen Monat?

Lösung:
1. Gehen Sie zu "Abrechnung → Monatsabrechnung"
2. Führen Sie den Wizard komplett durch (alle 5 Schritte)
3. Danach sollten Daten im Lohnjournal erscheinen
4. Jetzt den DATEV-Export erneut versuchen

⚠️ Wenn die Periode schon existiert aber leer ist, muss sie erst gelöscht und neu erstellt werden.`,
        tags: ["DATEV", "Export", "Leer", "Problem"],
      },
      {
        title: "Fibu-Journal zeigt keine Buchungssätze",
        content: `Das Fibu-Journal generiert Buchungssätze aus den gespeicherten Abrechnungsdaten.

Wenn es leer ist:
1. Prüfen Sie, ob Abrechnungen existieren: Gehen Sie zu "Abrechnung → Lohnjournal"
2. Wenn dort keine Einträge stehen → Erstellen Sie erst eine Abrechnung über den Wizard
3. Wenn Einträge vorhanden sind → Wählen Sie im Fibu-Journal die richtige Periode

💡 Der Wizard speichert seit dem letzten Update die Abrechnungen automatisch. Ältere, leere Perioden müssen neu erstellt werden.`,
        tags: ["Fibu", "Buchungssätze", "Journal", "Leer"],
      },
      {
        title: "Meldung: 'Keine aktiven Mitarbeiter vorhanden'",
        content: `Diese Meldung erscheint, wenn LohnPro keine aktiven Mitarbeiter findet.

Mögliche Ursachen:
1. 🔍 Noch keine Mitarbeiter angelegt → Gehen Sie zu "Mitarbeiter → Neuen Mitarbeiter anlegen"
2. 🔍 Alle Mitarbeiter haben ein Austrittsdatum → Prüfen Sie die Mitarbeiterliste
3. 🔍 Falscher Mandant ausgewählt → Prüfen Sie oben in der Kopfzeile, ob die richtige Firma ausgewählt ist

💡 Tipp: Ein neuer Mitarbeiter braucht mindestens Vorname, Nachname und Bruttogehalt.`,
        tags: ["Mitarbeiter", "Aktiv", "Fehlermeldung"],
      },
      {
        title: "Seite lädt nicht oder zeigt Fehler",
        content: `Wenn eine Seite nicht lädt oder eine Fehlermeldung zeigt:

Schnelle Lösungen:
1. 🔄 Laden Sie die Seite neu (F5 oder Strg+R)
2. 🗑️ Löschen Sie den Browser-Cache (Strg+Shift+Entf)
3. 🌐 Versuchen Sie einen anderen Browser (Chrome, Firefox, Edge)
4. 📱 Versuchen Sie es auf einem anderen Gerät

Wenn das Problem bestehen bleibt:
• Notieren Sie die genaue Fehlermeldung
• Machen Sie einen Screenshot
• Kontaktieren Sie uns über die Kontakt-Seite

⚠️ Verwenden Sie immer die neueste Version Ihres Browsers. Internet Explorer wird nicht unterstützt.`,
        tags: ["Fehler", "Laden", "Browser", "Cache"],
      },
      {
        title: "Sozialversicherungsbeiträge erscheinen falsch",
        content: `Wenn SV-Beiträge ungewöhnlich hoch oder niedrig erscheinen, prüfen Sie:

1. 🔍 Ist die Krankenkasse korrekt eingetragen? Verschiedene Kassen haben unterschiedliche Zusatzbeiträge.
2. 🔍 Stimmt das Geburtsdatum? Kinderlose über 23 zahlen einen PV-Zuschlag.
3. 🔍 Ist die Kinderzahl korrekt? Mehr Kinder = niedrigerer PV-Beitrag.
4. 🔍 Liegt das Gehalt über der Beitragsbemessungsgrenze? Dann werden SV-Beiträge nur bis zur Grenze berechnet.
5. 🔍 Ist es ein Minijob (bis 556 €)? Dann gelten pauschale Sätze.

💡 LohnPro berechnet nach den aktuellen gesetzlichen Sätzen 2025/2026. Die Berechnung folgt dem offiziellen PAP (Programmablaufplan des BMF).`,
        tags: ["SV-Beiträge", "Falsch", "Berechnung", "Prüfen"],
      },
    ],
  },
];

const faqs = [
  {
    question: "Ist LohnPro kostenlos?",
    answer: "Ja! Der Starter-Tarif ist dauerhaft kostenlos und umfasst bis zu 5 Mitarbeiter. Wenn Sie mehr Mitarbeiter haben oder Funktionen wie den DATEV-Export nutzen möchten, können Sie jederzeit auf den Professional- (49 €/Monat) oder Enterprise-Tarif (149 €/Monat) wechseln.",
  },
  {
    question: "Kann ich LohnPro auch auf dem Handy nutzen?",
    answer: "Ja, LohnPro funktioniert im Browser auf jedem Gerät – Computer, Tablet und Smartphone. Sie müssen nichts installieren. Einfach die Website öffnen und einloggen.",
  },
  {
    question: "Muss ich mich mit Steuern auskennen?",
    answer: "Nein! LohnPro berechnet alles automatisch nach den aktuellen gesetzlichen Vorgaben. Sie müssen nur die Stammdaten Ihrer Mitarbeiter eingeben (Steuerklasse, Krankenkasse etc.) – den Rest erledigt das System. Wenn Sie unsicher sind, fragen Sie Ihren Steuerberater.",
  },
  {
    question: "Was passiert, wenn sich Gesetze ändern?",
    answer: "LohnPro wird regelmäßig aktualisiert. Neue Steuer- und Sozialversicherungssätze werden zeitnah zum Jahreswechsel eingepflegt. Sie müssen nichts selbst aktualisieren – die neuesten Werte sind immer automatisch verfügbar.",
  },
  {
    question: "Kann mein Steuerberater die Daten nutzen?",
    answer: "Ja! Mit dem DATEV-Export können Sie Ihre Abrechnungsdaten in einem Format herunterladen, das Ihr Steuerberater direkt in seine Software einlesen kann. Das spart beiden Seiten viel Zeit und vermeidet Fehler.",
  },
  {
    question: "Wie ändere ich die Steuerklasse eines Mitarbeiters?",
    answer: 'Gehen Sie zu Mitarbeiter, wählen Sie den Mitarbeiter aus, klicken Sie auf "Bearbeiten", ändern Sie die Steuerklasse unter "Gehaltsdaten" und klicken Sie auf "Speichern". Die Änderung gilt ab der nächsten Abrechnung.',
  },
  {
    question: "Was mache ich, wenn eine Abrechnung falsch ist?",
    answer: 'Kein Problem! Öffnen Sie die betroffene Abrechnungsperiode, klicken Sie auf den Mitarbeiter und dann auf "Korrektur erstellen". Das System berechnet automatisch die Differenzen und berücksichtigt diese in der nächsten Abrechnung.',
  },
  {
    question: "Kann ich eine Abrechnung rückgängig machen?",
    answer: "Eine abgeschlossene Abrechnung kann nicht gelöscht werden (das wäre auch buchhalterisch nicht erlaubt). Stattdessen erstellen Sie eine Korrekturabrechnung, die die Fehler ausgleicht. So bleibt alles nachvollziehbar und revisionssicher.",
  },
  {
    question: "Was ist, wenn ein Mitarbeiter die Krankenkasse wechselt?",
    answer: "Aktualisieren Sie einfach die Krankenkasse in den Mitarbeiterdaten: Mitarbeiter → Bearbeiten → neue Krankenkasse eintragen → Speichern. Ab der nächsten Abrechnung werden die Beiträge an die neue Krankenkasse berechnet.",
  },
  {
    question: "Wie sichere ich meine Daten?",
    answer: 'Ihre Daten werden automatisch in der Cloud gespeichert und verschlüsselt. Es sind keine manuellen Backups nötig. Zusätzlich können Sie unter "Berichte" jederzeit alle Daten als Datei herunterladen.',
  },
  {
    question: "Kann jemand anderes meine Daten sehen?",
    answer: "Nein! Jede Firma hat einen eigenen, vollständig abgeschotteten Datenbereich. Andere Firmen können Ihre Daten nicht sehen – auch nicht der LohnPro-Support. Nur die Benutzer, die Sie selbst eingeladen haben, haben Zugriff.",
  },
  {
    question: "Ich habe mein Passwort vergessen – was tun?",
    answer: 'Klicken Sie auf der Anmeldeseite auf "Passwort vergessen?", geben Sie Ihre E-Mail-Adresse ein und folgen Sie dem Link in der E-Mail. Dort können Sie ein neues Passwort festlegen.',
  },
  {
    question: "Was ist der Unterschied zwischen Brutto und Netto?",
    answer: "Brutto ist das Gehalt vor allen Abzügen – also der Betrag, der im Arbeitsvertrag steht. Davon werden Steuern (Lohnsteuer, Soli, ggf. Kirchensteuer) und Sozialversicherungsbeiträge (KV, RV, AV, PV) abgezogen. Was übrig bleibt, ist das Netto – der Betrag, der auf dem Konto landet.",
  },
  {
    question: "Wie funktioniert der Monats-Wizard?",
    answer: "Der Wizard führt Sie in 5 Schritten durch die monatliche Abrechnung: 1) Zeiterfassung prüfen, 2) Sonderzahlungen prüfen, 3) Abrechnung berechnen und speichern, 4) Meldungen vorbereiten, 5) Export und Freigabe. Sie können den Wizard auch per Auto-Run automatisch durchlaufen lassen – er stoppt nur, wenn eine manuelle Prüfung nötig ist.",
  },
  {
    question: "Was bedeutet 'Beitragsbemessungsgrenze'?",
    answer: "Die Beitragsbemessungsgrenze (BBG) ist ein Höchstbetrag, bis zu dem Sozialversicherungsbeiträge berechnet werden. Verdient ein Mitarbeiter mehr als die BBG, werden die SV-Beiträge nur bis zur Grenze berechnet. 2025 liegt die BBG für die Renten-/Arbeitslosenversicherung bei 8.050 € (West) bzw. 7.450 € (Ost) monatlich.",
  },
  {
    question: "Was ist ein Minijob und was muss ich beachten?",
    answer: "Ein Minijob ist eine geringfügige Beschäftigung mit maximal 556 € Gehalt pro Monat (Stand 2025). Der Arbeitgeber zahlt pauschale Abgaben (2% Steuer + SV-Pauschalen). Der Arbeitnehmer muss keine Steuern zahlen. LohnPro erkennt Minijobs automatisch anhand des Gehalts und wendet die richtigen Pauschalen an.",
  },
  {
    question: "Wie lade ich eine Entgeltabrechnung als PDF herunter?",
    answer: 'Gehen Sie zum Lohnjournal (Abrechnung → Lohnjournal) und klicken Sie auf das PDF-Symbol neben dem gewünschten Eintrag. Die Abrechnung wird als druckfertiges PDF mit allen Details (Brutto, Steuern, SV-Beiträge, Netto) heruntergeladen.',
  },
  {
    question: "Was bedeutet die Märzklausel?",
    answer: "Die Märzklausel regelt, dass Einmalzahlungen (z.B. Weihnachtsgeld, Jahresbonus) in den Monaten Januar bis März dem Vorjahr zugeordnet werden können, wenn das Arbeitsverhältnis schon im Vorjahr bestand. LohnPro prüft dies automatisch und wendet die Regelung korrekt an.",
  },
  {
    question: "Gibt es eine Schnittstelle zu SYSTAX?",
    answer: "Ja! LohnPro ist als Sub-App für die spätere Integration in das SYSTAX-Hauptsystem konzipiert. Die technischen Schnittstellen (Service-Layer für ELSTER und Bankanbindung) sind vorbereitet. Bei einem Upgrade auf SYSTAX werden Ihre Daten nahtlos übernommen.",
  },
];

const popularSearches = ["Mitarbeiter anlegen", "Abrechnung", "PDF", "DATEV", "Steuerklasse", "Zeiterfassung", "Minijob", "Krankenkasse"];

function highlightMatch(text: string, query: string) {
  if (!query || query.length < 2) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className="bg-primary/20 text-foreground rounded px-0.5">{part}</mark> : part
  );
}

export default function HilfeCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const navigate = useNavigate();

  const filteredCategories = categories.map((cat) => ({
    ...cat,
    articles: cat.articles.filter(
      (a) =>
        !searchQuery ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
  })).filter((cat) => cat.articles.length > 0);

  const filteredFaqs = faqs.filter(
    (f) =>
      !searchQuery ||
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalArticles = categories.reduce((sum, c) => sum + c.articles.length, 0);

  const activeCategory = selectedCategory
    ? filteredCategories.find((c) => c.id === selectedCategory)
    : null;

  return (
    <LegalLayout>
      <PageSeo
        title="Hilfe-Center | LohnPro"
        description="Einfache Anleitungen und Antworten für LohnPro – verständlich erklärt für jeden. Keine Vorkenntnisse nötig."
        path="/hilfe"
      />

      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 py-12">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-4">
              <BookOpen className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Hilfe-Center
            </h1>
            <p className="text-muted-foreground text-lg mb-2">
              Einfache Anleitungen – keine Vorkenntnisse nötig
            </p>
            <p className="text-muted-foreground text-sm mb-6">
              {totalArticles} Anleitungen in {categories.length} Kategorien · {faqs.length} häufige Fragen
            </p>

            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Was möchten Sie wissen? z.B. Mitarbeiter anlegen"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedCategory(null);
                }}
              />
              {!searchQuery && (
                <div className="flex flex-wrap gap-2 mt-3 justify-center">
                  {popularSearches.map((term) => (
                    <Badge
                      key={term}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10 transition-colors text-xs"
                      onClick={() => { setSearchQuery(term); setSelectedCategory(null); }}
                    >
                      {term}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-10">
        {/* Category detail view */}
        {activeCategory && !searchQuery ? (
          <div className="max-w-3xl mx-auto">
            <Button
              variant="ghost"
              size="sm"
              className="mb-6"
              onClick={() => setSelectedCategory(null)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Alle Kategorien
            </Button>

            <div className="flex items-center gap-3 mb-2">
              <activeCategory.icon className={`h-6 w-6 ${activeCategory.color}`} />
              <h2 className="text-2xl font-bold text-foreground">{activeCategory.title}</h2>
              <Badge variant="secondary">{activeCategory.articles.length} Artikel</Badge>
            </div>
            {activeCategory.description && (
              <p className="text-muted-foreground mb-6 ml-9">{activeCategory.description}</p>
            )}

            <div className="space-y-4">
              {activeCategory.articles.map((article, i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      {article.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-muted-foreground leading-relaxed mb-3 whitespace-pre-line">
                      {article.content}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {article.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Category grid */}
            {!searchQuery && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                {categories.map((cat) => (
                  <Card
                    key={cat.id}
                    className="cursor-pointer hover:shadow-md transition-shadow group"
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <cat.icon className={`h-5 w-5 ${cat.color}`} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground flex items-center gap-1">
                            {cat.title}
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">{cat.articles.length} Artikel</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Search results */}
            {searchQuery && (
              <div className="max-w-3xl mx-auto mb-12">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    {filteredCategories.reduce((s, c) => s + c.articles.length, 0) + filteredFaqs.length} Ergebnisse für „{searchQuery}"
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")}>
                    Suche zurücksetzen
                  </Button>
                </div>

                {/* Article results */}
                {filteredCategories.map((cat) => (
                  <div key={cat.id} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <cat.icon className={`h-4 w-4 ${cat.color}`} />
                      <h3 className="font-medium text-foreground">{cat.title}</h3>
                      <Badge variant="secondary" className="text-xs">{cat.articles.length}</Badge>
                    </div>
                    <div className="space-y-3">
                      {cat.articles.map((article, i) => (
                        <Card key={i} className="cursor-pointer hover:shadow-sm transition-shadow"
                          onClick={() => {
                            setSelectedCategory(cat.id);
                            setSearchQuery("");
                          }}>
                          <CardContent className="p-4">
                            <h4 className="font-medium text-foreground mb-1">{highlightMatch(article.title, searchQuery)}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">{highlightMatch(article.content.slice(0, 200), searchQuery)}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {article.tags.filter(t => t.toLowerCase().includes(searchQuery.toLowerCase())).map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs bg-primary/5">{tag}</Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}

                {/* FAQ results inline */}
                {filteredFaqs.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <HelpCircle className="h-4 w-4 text-primary" />
                      <h3 className="font-medium text-foreground">Häufige Fragen</h3>
                      <Badge variant="secondary" className="text-xs">{filteredFaqs.length}</Badge>
                    </div>
                    <Accordion type="multiple" className="space-y-2">
                      {filteredFaqs.map((faq, i) => (
                        <AccordionItem key={i} value={`faq-search-${i}`} className="border rounded-lg px-4">
                          <AccordionTrigger className="text-left font-medium">
                            {highlightMatch(faq.question, searchQuery)}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground leading-relaxed">
                            {highlightMatch(faq.answer, searchQuery)}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}

                {filteredCategories.length === 0 && filteredFaqs.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground mb-3">Keine Ergebnisse für „{searchQuery}" gefunden.</p>
                      <p className="text-sm text-muted-foreground mb-4">Versuchen Sie einen anderen Suchbegriff:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {popularSearches.slice(0, 4).map((term) => (
                          <Badge
                            key={term}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary/10 transition-colors"
                            onClick={() => setSearchQuery(term)}
                          >
                            {term}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* FAQ Section (non-search) */}
            {!searchQuery && filteredFaqs.length > 0 && (
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-2">
                  <HelpCircle className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">Häufige Fragen</h2>
                </div>
                <p className="text-muted-foreground mb-6 ml-9">Die wichtigsten Fragen – kurz und einfach beantwortet</p>
                <Accordion type="multiple" className="space-y-2">
                  {filteredFaqs.map((faq, i) => (
                    <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4">
                      <AccordionTrigger className="text-left font-medium">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {/* Quick Links */}
            {!searchQuery && (
              <div className="max-w-3xl mx-auto mt-12 grid sm:grid-cols-2 gap-4">
                <Card className="bg-muted/30 border-border/60">
                  <CardContent className="p-6 text-center">
                    <Mail className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold text-foreground mb-2">
                      Frage nicht beantwortet?
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Schreiben Sie uns – wir antworten innerhalb von 24 Stunden.
                    </p>
                    <Button onClick={() => navigate("/kontakt")} size="sm">
                      Kontakt aufnehmen
                    </Button>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30 border-border/60">
                  <CardContent className="p-6 text-center">
                    <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold text-foreground mb-2">
                      Datenschutz & Sicherheit
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Erfahren Sie, wie wir Ihre Daten schützen.
                    </p>
                    <Button variant="outline" onClick={() => navigate("/datenschutz")} size="sm">
                      Datenschutzerklärung
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </LegalLayout>
  );
}
