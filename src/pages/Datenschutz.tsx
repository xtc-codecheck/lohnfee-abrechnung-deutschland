import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageSeo } from "@/components/seo/page-seo";
import { ArrowLeft } from "lucide-react";

export default function Datenschutz() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageSeo
        title="Datenschutzerklärung"
        description="Datenschutzerklärung der LohnPro Lohnabrechnungssoftware gemäß DSGVO und BDSG."
        path="/datenschutz"
      />

      <div className="container mx-auto max-w-3xl px-6 py-12">
        <Button variant="ghost" onClick={() => navigate(-1 as any)} className="mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>

        <h1 className="text-3xl font-bold mb-8">Datenschutzerklärung</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Datenschutz auf einen Blick</h2>
            <h3 className="text-lg font-medium mb-2">Allgemeine Hinweise</h3>
            <p className="text-muted-foreground leading-relaxed">
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen
              Daten passiert, wenn Sie diese Website nutzen. Personenbezogene Daten sind alle Daten, mit denen
              Sie persönlich identifiziert werden können. Ausführliche Informationen zum Thema Datenschutz
              entnehmen Sie unserer nachfolgenden Datenschutzerklärung.
            </p>
            <h3 className="text-lg font-medium mb-2 mt-4">Datenerfassung auf dieser Website</h3>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong><br />
              Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten
              können Sie dem Impressum dieser Website entnehmen.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              <strong>Wie erfassen wir Ihre Daten?</strong><br />
              Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen (z. B. Registrierung,
              Eingabe von Mitarbeiterdaten). Andere Daten werden automatisch oder nach Ihrer Einwilligung beim
              Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten
              (z. B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs).
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              <strong>Wofür nutzen wir Ihre Daten?</strong><br />
              Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website und der
              Lohnabrechnungsfunktionen sicherzustellen. Andere Daten können zur Analyse Ihres Nutzerverhaltens
              verwendet werden.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">2. Hosting</h2>
            <p className="text-muted-foreground leading-relaxed">
              Wir hosten die Inhalte unserer Website bei Lovable Cloud. Anbieter ist die Lovable Inc.
              Details entnehmen Sie der Datenschutzerklärung von Lovable. Die Verwendung von Lovable Cloud
              erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Wir haben ein berechtigtes Interesse an
              einer möglichst zuverlässigen Darstellung unserer Website.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Die Datenbank wird über ein integriertes Backend (Lovable Cloud) betrieben. Die Server befinden
              sich in der EU. Es wurde ein Auftragsverarbeitungsvertrag (AVV) abgeschlossen.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">3. Allgemeine Hinweise und Pflichtinformationen</h2>
            <h3 className="text-lg font-medium mb-2">Datenschutz</h3>
            <p className="text-muted-foreground leading-relaxed">
              Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln
              Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften
              sowie dieser Datenschutzerklärung.
            </p>
            <h3 className="text-lg font-medium mb-2 mt-4">Hinweis zur verantwortlichen Stelle</h3>
            <p className="text-muted-foreground leading-relaxed">
              Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:<br /><br />
              LohnPro GmbH<br />
              Musterstraße 1<br />
              10115 Berlin<br /><br />
              Telefon: +49 (0) 30 123456-0<br />
              E-Mail: datenschutz@lohnpro.app
            </p>
            <h3 className="text-lg font-medium mb-2 mt-4">Speicherdauer</h3>
            <p className="text-muted-foreground leading-relaxed">
              Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt wurde,
              verbleiben Ihre personenbezogenen Daten bei uns, bis der Zweck für die Datenverarbeitung entfällt.
              Für lohnsteuer- und sozialversicherungsrechtliche Daten gelten die gesetzlichen Aufbewahrungsfristen
              von bis zu 10 Jahren (§ 41 EStG, § 28f SGB IV).
            </p>
            <h3 className="text-lg font-medium mb-2 mt-4">Datenschutzbeauftragter</h3>
            <p className="text-muted-foreground leading-relaxed">
              Sofern gesetzlich erforderlich, haben wir einen Datenschutzbeauftragten bestellt:<br /><br />
              E-Mail: dsb@lohnpro.app
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">4. Ihre Rechte als betroffene Person</h2>
            <p className="text-muted-foreground leading-relaxed">
              Sie haben gegenüber uns folgende Rechte hinsichtlich der Sie betreffenden personenbezogenen Daten:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li><strong>Auskunftsrecht</strong> (Art. 15 DSGVO)</li>
              <li><strong>Recht auf Berichtigung</strong> (Art. 16 DSGVO)</li>
              <li><strong>Recht auf Löschung</strong> (Art. 17 DSGVO) – unter Beachtung gesetzlicher Aufbewahrungsfristen</li>
              <li><strong>Recht auf Einschränkung der Verarbeitung</strong> (Art. 18 DSGVO)</li>
              <li><strong>Recht auf Datenübertragbarkeit</strong> (Art. 20 DSGVO)</li>
              <li><strong>Widerspruchsrecht</strong> (Art. 21 DSGVO)</li>
              <li><strong>Recht auf Widerruf einer Einwilligung</strong> (Art. 7 Abs. 3 DSGVO)</li>
              <li><strong>Beschwerderecht bei einer Aufsichtsbehörde</strong> (Art. 77 DSGVO)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Zur Ausübung Ihrer Rechte wenden Sie sich bitte an: datenschutz@lohnpro.app
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">5. Datenerfassung auf dieser Website</h2>
            <h3 className="text-lg font-medium mb-2">Registrierung und Nutzerkonto</h3>
            <p className="text-muted-foreground leading-relaxed">
              Für die Nutzung von LohnPro ist eine Registrierung erforderlich. Dabei erheben wir:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li>E-Mail-Adresse</li>
              <li>Passwort (verschlüsselt gespeichert)</li>
              <li>Anzeigename (optional)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
            </p>

            <h3 className="text-lg font-medium mb-2 mt-4">Lohnabrechnungsdaten</h3>
            <p className="text-muted-foreground leading-relaxed">
              Im Rahmen der Lohnabrechnung verarbeiten wir im Auftrag des Arbeitgebers u. a.:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li>Personalstammdaten (Name, Adresse, Geburtsdatum, Geschlecht)</li>
              <li>Steuerliche Daten (Steuer-ID, Steuerklasse, Kirchensteuermerkmal)</li>
              <li>Sozialversicherungsdaten (SV-Nummer, Krankenkasse)</li>
              <li>Bankverbindung (IBAN, BIC)</li>
              <li>Gehaltsdaten (Bruttolohn, Zulagen, Abzüge)</li>
              <li>Arbeitszeitdaten</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung), Art. 6 Abs. 1 lit. c DSGVO
              (rechtliche Verpflichtung, insb. steuer- und sozialversicherungsrechtliche Pflichten).
            </p>

            <h3 className="text-lg font-medium mb-2 mt-4">Server-Log-Dateien</h3>
            <p className="text-muted-foreground leading-relaxed">
              Der Provider der Seiten erhebt und speichert automatisch Informationen in sogenannten
              Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li>Browsertyp und Browserversion</li>
              <li>Verwendetes Betriebssystem</li>
              <li>Referrer URL</li>
              <li>Hostname des zugreifenden Rechners</li>
              <li>Uhrzeit der Serveranfrage</li>
              <li>IP-Adresse</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Diese Daten werden nicht mit anderen Datenquellen zusammengeführt.
              Grundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">6. Auftragsverarbeitung</h2>
            <p className="text-muted-foreground leading-relaxed">
              Soweit Sie LohnPro als Arbeitgeber zur Lohnabrechnung einsetzen, verarbeiten wir personenbezogene
              Daten Ihrer Mitarbeiter in Ihrem Auftrag. In diesem Fall sind Sie der Verantwortliche im Sinne der
              DSGVO. Die Verarbeitung erfolgt auf Grundlage eines Auftragsverarbeitungsvertrags gemäß
              Art. 28 DSGVO.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">7. Datensicherheit</h2>
            <p className="text-muted-foreground leading-relaxed">
              Wir setzen folgende technische und organisatorische Maßnahmen (TOMs) ein:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li>Verschlüsselte Datenübertragung (TLS/SSL)</li>
              <li>Verschlüsselte Datenspeicherung</li>
              <li>Mandantenspezifische Datenisolation (Row Level Security)</li>
              <li>Rollenbasierte Zugriffskontrolle (Admin, Sachbearbeiter, Leserecht)</li>
              <li>Audit-Logging aller relevanten Datenzugriffe</li>
              <li>Regelmäßige Backups</li>
              <li>Serverstandort in der EU</li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">8. Aufbewahrungsfristen</h2>
            <p className="text-muted-foreground leading-relaxed">
              Für Lohnabrechnungsdaten gelten folgende gesetzliche Aufbewahrungsfristen:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li><strong>6 Jahre:</strong> Handels- und Geschäftsbriefe (§ 257 HGB)</li>
              <li><strong>10 Jahre:</strong> Lohnkonten, Buchungsbelege (§ 41 EStG, § 147 AO)</li>
              <li><strong>Bis 30 Jahre:</strong> Unterlagen zu betrieblicher Altersversorgung</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Nach Ablauf der Aufbewahrungsfrist werden die Daten gelöscht, sofern keine weiteren
              gesetzlichen Aufbewahrungspflichten bestehen.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">9. Cookies und Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              LohnPro verwendet ausschließlich technisch notwendige Cookies für die Authentifizierung
              und Sitzungsverwaltung. Es werden keine Marketing- oder Tracking-Cookies eingesetzt.
              Eine gesonderte Cookie-Einwilligung ist daher nicht erforderlich.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">10. Änderungen dieser Datenschutzerklärung</h2>
            <p className="text-muted-foreground leading-relaxed">
              Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets den aktuellen
              rechtlichen Anforderungen entspricht oder um Änderungen unserer Leistungen in der
              Datenschutzerklärung umzusetzen. Für Ihren erneuten Besuch gilt dann die neue
              Datenschutzerklärung.
            </p>
          </section>
        </div>

        <p className="mt-12 text-sm text-muted-foreground">
          Stand: April 2026. Bitte ersetzen Sie die Platzhalterdaten durch Ihre tatsächlichen Unternehmensangaben
          und lassen Sie diese Datenschutzerklärung von einem Rechtsanwalt prüfen.
        </p>
      </div>
    </div>
  );
}
