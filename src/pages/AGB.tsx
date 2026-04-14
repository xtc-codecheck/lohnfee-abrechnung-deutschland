import { PageSeo } from "@/components/seo/page-seo";
import { LegalLayout } from "@/components/layout/legal-layout";

export default function AGB() {
  return (
    <LegalLayout>
      <PageSeo
        title="Allgemeine Geschäftsbedingungen"
        description="AGB der LohnPro Lohnabrechnungssoftware – Nutzungsbedingungen, Leistungsumfang, Haftung und Datenschutz."
        path="/agb"
      />

      <div className="container mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Allgemeine Geschäftsbedingungen (AGB)</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-3">§ 1 Geltungsbereich</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Diese Allgemeinen Geschäftsbedingungen (nachfolgend „AGB") gelten für alle Verträge zwischen der
              LohnPro GmbH, Musterstraße 1, 10115 Berlin (nachfolgend „Anbieter") und dem Kunden (nachfolgend „Nutzer")
              über die Nutzung der webbasierten Lohnabrechnungssoftware „LohnPro" (nachfolgend „Software").
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              (2) Abweichende, entgegenstehende oder ergänzende AGB des Nutzers werden nur dann Vertragsbestandteil,
              wenn der Anbieter ihrer Geltung ausdrücklich schriftlich zugestimmt hat.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              (3) Der Nutzer kann Verbraucher oder Unternehmer sein. Unternehmer im Sinne dieser AGB ist jede natürliche
              oder juristische Person, die bei Abschluss des Vertrages in Ausübung ihrer gewerblichen oder selbständigen
              beruflichen Tätigkeit handelt (§ 14 BGB).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">§ 2 Vertragsgegenstand und Leistungsumfang</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Der Anbieter stellt dem Nutzer die Software als Software-as-a-Service (SaaS) über das Internet zur
              Verfügung. Die Software ermöglicht insbesondere:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li>Erstellung von Lohnabrechnungen nach deutschem Recht</li>
              <li>Verwaltung von Mitarbeiterstammdaten</li>
              <li>Berechnung von Lohnsteuer und Sozialversicherungsbeiträgen</li>
              <li>Erstellung von SV-Meldungen und Beitragsnachweisen</li>
              <li>DATEV-Export von Abrechnungsdaten</li>
              <li>Zeiterfassung und Arbeitszeitverwaltung</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              (2) Der konkrete Funktionsumfang richtet sich nach dem vom Nutzer gewählten Tarif (Starter, Professional
              oder Enterprise). Die Tarifbeschreibungen auf der Website des Anbieters sind maßgeblich.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              (3) Der Anbieter schuldet eine Verfügbarkeit der Software von 99,5 % im Jahresdurchschnitt. Geplante
              Wartungsarbeiten werden mindestens 48 Stunden im Voraus angekündigt und zählen nicht als Ausfallzeit.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">§ 3 Vertragsschluss und Registrierung</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Die Darstellung der Software auf der Website stellt kein rechtlich bindendes Angebot, sondern eine
              unverbindliche Einladung zur Abgabe eines Angebots dar.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              (2) Durch die Registrierung gibt der Nutzer ein verbindliches Angebot zum Abschluss eines
              Nutzungsvertrages ab. Der Vertrag kommt mit der Bestätigung der Registrierung durch den Anbieter zustande.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              (3) Der Nutzer ist verpflichtet, bei der Registrierung wahrheitsgemäße und vollständige Angaben zu machen
              und diese bei Änderungen unverzüglich zu aktualisieren.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">§ 4 Preise und Zahlungsbedingungen</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Die Nutzung der Software im Starter-Tarif ist kostenlos. Für die Tarife Professional und Enterprise
              gelten die auf der Website angegebenen monatlichen Entgelte.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              (2) Alle Preise verstehen sich zuzüglich der gesetzlichen Umsatzsteuer, sofern nicht anders angegeben.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              (3) Die Abrechnung erfolgt monatlich im Voraus. Rechnungen sind innerhalb von 14 Tagen nach
              Rechnungsdatum ohne Abzug zu zahlen.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              (4) Der Anbieter behält sich das Recht vor, die Preise mit einer Ankündigungsfrist von 4 Wochen zum
              Ende eines Abrechnungszeitraums anzupassen. Der Nutzer hat in diesem Fall ein Sonderkündigungsrecht.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">§ 5 Pflichten des Nutzers</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Der Nutzer ist für die Richtigkeit und Vollständigkeit der von ihm eingegebenen Daten verantwortlich.
              Der Anbieter übernimmt keine Haftung für fehlerhafte Abrechnungen aufgrund unrichtiger Eingabedaten.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              (2) Der Nutzer ist verpflichtet, seine Zugangsdaten geheim zu halten und vor dem Zugriff Dritter zu
              schützen. Bei Verdacht auf Missbrauch ist der Anbieter unverzüglich zu informieren.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              (3) Der Nutzer stellt sicher, dass er alle erforderlichen Einwilligungen seiner Mitarbeiter zur
              Verarbeitung personenbezogener Daten eingeholt hat, soweit diese über die gesetzliche Grundlage
              hinaus erforderlich sind.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              (4) Der Nutzer bleibt auch bei Nutzung der Software für die Einhaltung aller steuer- und
              sozialversicherungsrechtlichen Pflichten als Arbeitgeber verantwortlich.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">§ 6 Datenschutz und Auftragsverarbeitung</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Der Anbieter verarbeitet personenbezogene Daten des Nutzers und dessen Mitarbeiter gemäß den
              geltenden Datenschutzvorschriften, insbesondere der DSGVO und des BDSG.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              (2) Soweit der Anbieter im Auftrag des Nutzers personenbezogene Daten von dessen Mitarbeitern
              verarbeitet, schließen die Parteien einen Auftragsverarbeitungsvertrag gemäß Art. 28 DSGVO ab.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              (3) Weitere Einzelheiten entnehmen Sie bitte unserer{" "}
              <button onClick={() => navigate("/datenschutz")} className="text-primary hover:underline">
                Datenschutzerklärung
              </button>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">§ 7 Gewährleistung und Haftung</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Der Anbieter gewährleistet, dass die Software im Wesentlichen den in der Leistungsbeschreibung
              angegebenen Funktionen entspricht.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              (2) Die Software berechnet Lohnsteuer und Sozialversicherungsbeiträge nach bestem Wissen und
              Gewissen auf Basis der aktuellen gesetzlichen Grundlagen. Eine Garantie für die absolute
              Richtigkeit aller Berechnungen kann aufgrund der Komplexität des deutschen Lohnsteuerrechts
              nicht übernommen werden. Der Nutzer ist verpflichtet, die Ergebnisse auf Plausibilität zu prüfen.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              (3) Die Haftung des Anbieters für leichte Fahrlässigkeit ist auf die Verletzung wesentlicher
              Vertragspflichten (Kardinalpflichten) beschränkt. In diesem Fall ist die Haftung auf den
              vorhersehbaren, vertragstypischen Schaden begrenzt.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              (4) Die vorstehenden Haftungsbeschränkungen gelten nicht bei Vorsatz, grober Fahrlässigkeit,
              Verletzung von Leben, Körper oder Gesundheit sowie bei zwingenden gesetzlichen Haftungstatbeständen.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              (5) Die Haftung des Anbieters ist in jedem Fall auf den jährlichen Vertragswert begrenzt,
              maximal jedoch auf 50.000 Euro pro Schadensfall.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">§ 8 Vertragslaufzeit und Kündigung</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Der Vertrag für den Starter-Tarif wird auf unbestimmte Zeit geschlossen und kann jederzeit
              ohne Einhaltung einer Frist gekündigt werden.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              (2) Kostenpflichtige Tarife haben eine Mindestlaufzeit von einem Monat und verlängern sich jeweils
              um einen weiteren Monat, sofern nicht mit einer Frist von 14 Tagen zum Ende des jeweiligen
              Abrechnungszeitraums gekündigt wird.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              (3) Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              (4) Nach Vertragsende wird der Anbieter dem Nutzer seine Daten in einem gängigen Format zum
              Download bereitstellen. Nach Ablauf einer Übergangsfrist von 30 Tagen werden die Daten gelöscht,
              sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">§ 9 Änderungen der AGB</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Der Anbieter behält sich vor, diese AGB mit Wirkung für die Zukunft zu ändern, soweit dies aus
              triftigen Gründen erforderlich ist und der Nutzer nicht unangemessen benachteiligt wird.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              (2) Änderungen werden dem Nutzer mindestens 4 Wochen vor Inkrafttreten per E-Mail mitgeteilt.
              Widerspricht der Nutzer nicht innerhalb von 4 Wochen nach Zugang der Mitteilung, gelten die
              geänderten AGB als angenommen. Auf die Bedeutung des Schweigens wird in der Änderungsmitteilung
              hingewiesen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">§ 10 Widerrufsrecht für Verbraucher</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Verbraucher haben das Recht, binnen 14 Tagen ohne Angabe von Gründen den Vertrag zu widerrufen.
              Die Widerrufsfrist beträgt 14 Tage ab dem Tag des Vertragsschlusses.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              (2) Um Ihr Widerrufsrecht auszuüben, müssen Sie uns mittels einer eindeutigen Erklärung
              (z. B. E-Mail an widerruf@lohnpro.app) über Ihren Entschluss, diesen Vertrag zu widerrufen,
              informieren.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              (3) Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des
              Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">§ 11 Schlussbestimmungen</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts (CISG).
              Bei Verbrauchern gilt dies nur insoweit, als nicht zwingende Verbraucherschutzbestimmungen des
              Aufenthaltsstaates des Verbrauchers entgegenstehen.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              (2) Ist der Nutzer Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches
              Sondervermögen, ist ausschließlicher Gerichtsstand für alle Streitigkeiten aus diesem Vertrag
              Berlin.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              (3) Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit
              der übrigen Bestimmungen davon unberührt.
            </p>
          </section>
        </div>

        <p className="mt-12 text-sm text-muted-foreground">
          Stand: April 2026. Bitte ersetzen Sie die Platzhalterdaten durch Ihre tatsächlichen Unternehmensangaben
          und lassen Sie diese AGB von einem Rechtsanwalt prüfen.
        </p>
      </div>
    </div>
  );
}
