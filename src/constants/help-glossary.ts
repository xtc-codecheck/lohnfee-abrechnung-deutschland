/**
 * Zentrales Glossar mit laienverständlichen Erklärungen
 * für alle Fachbegriffe in der Lohnbuchhaltung.
 */

export interface GlossaryEntry {
  /** Kurze Erklärung (1-2 Sätze) */
  help: string;
  /** Optionales Beispiel */
  example?: string;
  /** Wo findet man die Info? */
  hint?: string;
}

// ─── Persönliche Daten ─────────────────────────────────
export const HELP = {
  // Steuer-Grundlagen
  taxId: {
    help: "Die Steuer-Identifikationsnummer ist eine 11-stellige Nummer, die jeder in Deutschland vom Finanzamt bekommt. Sie ändert sich nie – auch nicht bei Umzug oder Heirat.",
    example: "12 345 678 901",
    hint: "Steht auf dem Einkommensteuerbescheid oder der Lohnsteuerbescheinigung des Mitarbeiters.",
  },
  taxClass: {
    help: "Die Steuerklasse bestimmt, wie viel Lohnsteuer monatlich abgezogen wird. Sie hängt vom Familienstand ab.",
    example: "Klasse I = Ledige, Klasse III = Verheiratete (Hauptverdiener), Klasse V = Verheiratete (Geringverdiener)",
    hint: "Der Mitarbeiter teilt Ihnen seine Steuerklasse mit. Im Zweifel steht sie auf seiner letzten Gehaltsabrechnung.",
  },
  taxClassI: {
    help: "Für Ledige, Geschiedene, Verwitwete (ab dem übernächsten Jahr) oder dauerhaft getrennt Lebende.",
  },
  taxClassII: {
    help: "Für Alleinerziehende mit mindestens einem Kind im Haushalt. Enthält den Entlastungsbetrag.",
  },
  taxClassIII: {
    help: "Für Verheiratete, wenn einer deutlich mehr verdient. Der Partner wählt dann Klasse V. Ergibt zusammen weniger Steuerabzug als 2× Klasse IV.",
  },
  taxClassIV: {
    help: "Für Verheiratete, die etwa gleich viel verdienen. Beide haben dann Klasse IV.",
  },
  taxClassV: {
    help: "Für Verheiratete mit geringerem Einkommen, wenn der Partner Klasse III hat. Hier wird mehr Steuer abgezogen.",
  },
  taxClassVI: {
    help: "Für Zweit- und Nebenjobs. Hier wird die höchste Lohnsteuer abgezogen, da alle Freibeträge bereits beim Hauptjob berücksichtigt werden.",
  },
  childAllowances: {
    help: "Kinderfreibeträge reduzieren die Steuerlast. Pro Kind wird 0,5 oder 1,0 eingetragen – je nachdem ob ein oder beide Elternteile den Freibetrag nutzen.",
    example: "1 Kind, beide Eltern angestellt → je 0,5 pro Elternteil",
    hint: "Steht auf der elektronischen Lohnsteuerkarte (ELStAM) des Mitarbeiters.",
  },
  numberOfChildren: {
    help: "Die tatsächliche Anzahl der Kinder unter 25 Jahren. Beeinflusst den Beitrag zur Pflegeversicherung: Kinderlose zahlen mehr, ab 2 Kindern gibt es Abschläge.",
    example: "2 Kinder unter 25 → 0,25% weniger PV-Beitrag",
  },

  // Sozialversicherung
  socialSecurityNumber: {
    help: "Die Sozialversicherungsnummer (SV-Nummer) ist eine 12-stellige Kennung für die Rentenversicherung. Jeder Arbeitnehmer hat genau eine.",
    example: "65 170883 W 012",
    hint: "Steht auf dem Sozialversicherungsausweis, den der Mitarbeiter bei Arbeitsbeginn vorlegen muss.",
  },
  healthInsurance: {
    help: "Die gesetzliche Krankenkasse des Mitarbeiters. Der Beitragssatz besteht aus dem allgemeinen Satz (14,6%) plus einem kassenindividuellen Zusatzbeitrag.",
    hint: "Fragen Sie den Mitarbeiter nach seiner Krankenkasse und der Mitgliedsnummer.",
  },
  healthInsuranceRate: {
    help: "Jede Krankenkasse erhebt einen individuellen Zusatzbeitrag (z.B. 1,7%). Dieser wird automatisch eingetragen, wenn Sie die Krankenkasse oben auswählen.",
    example: "TK: 1,20%, AOK Bayern: 1,58%, Barmer: 2,19%",
  },

  // Religion
  religion: {
    help: "Nur Mitglieder einer steuererhebenden Religionsgemeinschaft zahlen Kirchensteuer (8% oder 9% der Lohnsteuer, je nach Bundesland). Wer ausgetreten ist oder keiner Kirche angehört, zahlt keine.",
    hint: "Steht auf der Lohnsteuerkarte oder im Meldebescheinigung.",
  },

  // Bundesland
  state: {
    help: "Das Bundesland ist wichtig für: Kirchensteuersatz (8% oder 9%), Beitragsbemessungsgrenzen (Ost/West) und Feiertage.",
    example: "Bayern = 8% Kirchensteuer, NRW = 9% Kirchensteuer",
  },

  // Beschäftigungsdaten
  employmentType: {
    help: "Die Art des Arbeitsverhältnisses bestimmt, wie Steuern und Sozialversicherung berechnet werden.",
    example: "Minijob (≤556€) = pauschale Abgaben, Vollzeit = volle Abzüge",
  },
  minijob: {
    help: "Ein Minijob ist eine geringfügige Beschäftigung mit max. 556€/Monat (2025). Der Arbeitgeber zahlt pauschale Abgaben, der Mitarbeiter bekommt das Gehalt praktisch brutto=netto.",
  },
  midijob: {
    help: "Ein Midijob (Übergangsbereich) liegt zwischen 556,01€ und 2.000€/Monat. Der Arbeitnehmer zahlt reduzierte Sozialversicherungsbeiträge – ein guter Übergang zum Vollzeitjob.",
  },
  weeklyHours: {
    help: "Die vertraglich vereinbarte Arbeitszeit pro Woche. Vollzeit sind in Deutschland meist 38-40 Stunden. Teilzeit ist alles darunter.",
    example: "Vollzeit: 40h, Teilzeit 50%: 20h",
  },
  vacationDays: {
    help: "Der gesetzliche Mindesturlaub beträgt 20 Tage (bei 5-Tage-Woche). Viele Verträge sehen 25-30 Tage vor.",
    hint: "Steht im Arbeitsvertrag des Mitarbeiters.",
  },
  startDate: {
    help: "Der erste Arbeitstag. Ab diesem Datum ist der Mitarbeiter sozialversicherungspflichtig und muss bei der Krankenkasse angemeldet werden.",
  },

  // Gehalt
  grossSalary: {
    help: "Das Bruttogehalt ist der Betrag im Arbeitsvertrag – vor allen Abzügen. Davon werden Steuern und Sozialversicherung abgezogen. Was übrig bleibt, ist das Netto.",
    example: "Brutto 3.500€ → nach Abzügen ca. 2.300€ netto (je nach Steuerklasse)",
    hint: "Steht im Arbeitsvertrag unter 'Vergütung' oder 'Gehalt'.",
  },
  hourlyWage: {
    help: "Der vereinbarte Stundenlohn. Der gesetzliche Mindestlohn beträgt 2025: 12,82€/Stunde.",
    hint: "Steht im Arbeitsvertrag.",
  },
  salaryType: {
    help: "Festgehalt = jeden Monat gleich viel. Stundenlohn = Gehalt variiert je nach Arbeitsstunden. Variabel = Mischung aus beidem.",
  },

  // Zusatzleistungen
  companyCarListPrice: {
    help: "Der Bruttolistenpreis des Firmenwagens (Neupreis inkl. MwSt und Sonderausstattung). Davon wird der geldwerte Vorteil berechnet, der als Einkommen versteuert wird.",
    example: "Listenpreis 40.000€, Benziner → 1% = 400€/Monat geldwerter Vorteil",
  },
  companyCarType: {
    help: "Elektroautos werden steuerlich begünstigt: Nur 0,25% (bis 80.000€) oder 0,5% statt 1% des Listenpreises werden als geldwerter Vorteil angerechnet.",
  },
  bav: {
    help: "Bei der betrieblichen Altersvorsorge (bAV) wandelt der Mitarbeiter einen Teil seines Bruttogehalts in eine Rentenversicherung um. Der Vorteil: Auf diesen Betrag fallen weniger Steuern und SV-Beiträge an.",
    example: "200€/Monat bAV → ca. 100€ weniger Netto, aber 200€ für die Rente",
    hint: "Der Arbeitgeber muss mindestens 15% Zuschuss zur bAV zahlen.",
  },
  vl: {
    help: "Vermögenswirksame Leistungen (VL) sind ein freiwilliger Zuschuss des Arbeitgebers zum Vermögensaufbau. Üblich sind 6,65€ bis 40€/Monat.",
    example: "40€/Monat VL in einen Bausparvertrag",
    hint: "Steht im Arbeitsvertrag oder Tarifvertrag.",
  },
  sachbezuege: {
    help: "Sachbezüge sind geldwerte Vorteile, die nicht als Geld ausgezahlt werden – z.B. Essensmarken, Tankgutscheine oder ein Jobticket. Bis 50€/Monat sind sie steuerfrei.",
    example: "Tankgutschein 50€/Monat = steuerfrei",
  },
  taxFreeBenefits: {
    help: "Bestimmte Leistungen sind komplett steuerfrei: z.B. Zuschüsse zur Kinderbetreuung, Gesundheitsförderung (bis 600€/Jahr) oder Erholungsbeihilfen.",
  },
  travelExpenses: {
    help: "Fahrtkostenerstattung für den Arbeitsweg. Die Entfernungspauschale beträgt 0,30€/km (ab dem 21. km: 0,38€/km) für die einfache Strecke.",
    example: "30 km einfacher Arbeitsweg × 0,30€ × 20 Tage = 180€/Monat",
  },
  bonus13th: {
    help: "Das 13. Monatsgehalt (Weihnachtsgeld) ist eine Sonderzahlung, meist im November oder Dezember. Es wird wie normales Gehalt besteuert – oft mit einem höheren Steuersatz.",
  },

  // Bankdaten
  iban: {
    help: "Die IBAN (Internationale Bankkontonummer) ist die Kontonummer für Überweisungen. Deutsche IBANs beginnen immer mit 'DE' und haben 22 Zeichen.",
    example: "DE89 3704 0044 0532 0130 00",
    hint: "Steht auf der Bankkarte, im Online-Banking oder auf Kontoauszügen.",
  },
  bic: {
    help: "Der BIC (Bank Identifier Code) identifiziert die Bank. Wird für Überweisungen ins Ausland benötigt – innerhalb Deutschlands meist nicht nötig.",
    example: "COBADEFFXXX (Commerzbank)",
  },

  // Meldewesen
  betriebsnummer: {
    help: "Die 8-stellige Betriebsnummer identifiziert Ihren Betrieb bei der Sozialversicherung. Ohne diese Nummer können keine SV-Meldungen erstellt werden.",
    hint: "Erhalten Sie bei der Betriebsnummern-Service-Stelle der Bundesagentur für Arbeit. Ihre Krankenkasse kann Ihnen dabei helfen.",
  },
  svMeldung: {
    help: "Sozialversicherungsmeldungen sind Pflichtmeldungen an die Krankenkasse. Sie müssen bei jeder Neueinstellung, jedem Austritt und einmal jährlich erstellt werden.",
  },
  beitragsnachweis: {
    help: "Der Beitragsnachweis zeigt der Krankenkasse, wie viel SV-Beiträge Sie für alle Mitarbeiter dieser Kasse überweisen müssen. Er muss bis zum drittletzten Bankarbeitstag des Monats eingereicht werden.",
  },
  lohnsteuerbescheinigung: {
    help: "Die elektronische Lohnsteuerbescheinigung (eLStB) ist eine jährliche Meldung ans Finanzamt mit allen Lohn- und Steuerangaben eines Mitarbeiters. Sie muss bis Ende Februar des Folgejahres übermittelt werden.",
  },
  lohnsteueranmeldung: {
    help: "Die Lohnsteueranmeldung meldet dem Finanzamt die einbehaltene Lohnsteuer aller Mitarbeiter. Je nach Höhe ist sie monatlich, vierteljährlich oder jährlich fällig.",
  },

  // Branchenmodule
  sokaBAU: {
    help: "Die SOKA-BAU ist die Sozialkasse der Bauwirtschaft. Baubetriebe zahlen Umlagen für Urlaubsgeld und Berufsausbildung. Der Beitragssatz beträgt ca. 15,2% auf den Bruttolohn.",
  },
  sfnZuschlaege: {
    help: "SFN-Zuschläge (Sonntags-, Feiertags- und Nachtzuschläge) sind in bestimmten Grenzen steuerfrei: Nachtarbeit 25%, Sonntag 50%, Feiertag 125%, Heiligabend/Silvester 150%.",
  },
  sachbezugMahlzeiten: {
    help: "Wenn der Arbeitgeber Mahlzeiten stellt, wird ein steuerlicher Sachbezugswert angesetzt: Frühstück 2,17€, Mittag-/Abendessen je 4,13€ (Werte 2025).",
  },

  // ─── Lohnsteuer (vertieft) ─────────────────────────────
  lohnsteuer: {
    help: "Die Lohnsteuer ist die Einkommensteuer auf das Arbeitsentgelt. Sie wird vom Arbeitgeber direkt vom Bruttolohn einbehalten und ans Finanzamt abgeführt.",
    example: "Brutto 3.500€, Steuerklasse I → ca. 430€ Lohnsteuer/Monat",
    hint: "Höhe abhängig von Steuerklasse, Kinderfreibeträgen und Kirchensteuerpflicht.",
  },
  solidaritaetszuschlag: {
    help: "Der Solidaritätszuschlag (Soli) beträgt 5,5% der Lohnsteuer. Seit 2021 zahlen ihn nur noch Spitzenverdiener (Freigrenze 2025: ~18.130€ Lohnsteuer/Jahr in Klasse I).",
    example: "Bei 50.000€ Brutto/Jahr (Klasse I): 0€ Soli",
  },
  kirchensteuer: {
    help: "Die Kirchensteuer wird zusätzlich zur Lohnsteuer erhoben, wenn der Mitarbeiter Mitglied einer steuererhebenden Religionsgemeinschaft ist. Satz: 8% (Bayern, BW) oder 9% (übrige Bundesländer).",
    example: "Lohnsteuer 430€ × 9% = 38,70€ Kirchensteuer (NRW, ev./kath.)",
  },
  pauschaleLohnsteuer: {
    help: "Bei Minijobs, kurzfristigen Beschäftigungen oder Sachbezügen kann der Arbeitgeber pauschal versteuern (z.B. 2% bei Minijob). Der Mitarbeiter zahlt dann selbst keine Lohnsteuer mehr.",
    example: "Minijob 538€ → AG zahlt 2% Pauschalsteuer = 10,76€",
  },
  lohnsteuertabelle: {
    help: "Die Lohnsteuertabelle wird vom BMF jährlich veröffentlicht und ist Grundlage der Berechnung. Es gibt eine 'allgemeine' (für SV-Pflichtige) und eine 'besondere' Tabelle (für Versorgungsbezüge).",
    hint: "LohnPro nutzt das offizielle PAP (Programmablaufplan) 2025/2026 — cent-genau wie das BMF.",
  },
  freibetrag: {
    help: "Ein Freibetrag mindert die Steuerlast. Beispiele: Grundfreibetrag 2025 = 12.084€/Jahr (steuerfrei), Arbeitnehmer-Pauschbetrag 1.230€, Sonderausgaben-Pauschbetrag 36€.",
  },
  faktorverfahren: {
    help: "Statt Klasse III/V können Verheiratete das Faktorverfahren wählen (Klasse IV mit Faktor). Der Faktor sorgt dafür, dass beide Partner monatlich annähernd ihre tatsächliche Steuerlast zahlen.",
    example: "Faktor 0,852 → Klasse IV/IV mit gerechterer Verteilung",
  },
  jahresausgleich: {
    help: "Beim Lohnsteuer-Jahresausgleich (durch den Arbeitgeber im Dezember) wird die Steuer aufs Gesamtjahr neu berechnet. Zu viel gezahlte Lohnsteuer wird erstattet.",
    hint: "Pflicht ab 10 Mitarbeitern oder auf Antrag. LohnPro erledigt dies automatisch.",
  },
  maerzklausel: {
    help: "Die Märzklausel betrifft Einmalzahlungen (Boni, Weihnachtsgeld), die im 1. Quartal gezahlt werden. Sie werden steuerlich dem Vorjahr zugerechnet, wenn dort die BBG noch nicht ausgeschöpft war.",
    example: "Bonus im März 2026 → ggf. SV-pflichtig in 2025",
  },

  // ─── Sozialversicherung (vertieft) ─────────────────────
  beitragsbemessungsgrenze: {
    help: "Die BBG ist die Einkommensobergrenze, bis zu der Sozialversicherungsbeiträge erhoben werden. Was darüber verdient wird, ist beitragsfrei. KV/PV: 66.150€/Jahr (2025), RV/AV: 96.600€ West / 89.400€ Ost.",
    example: "Brutto 8.000€/Monat → KV-Beitrag wird nur auf 5.512,50€ berechnet",
  },
  zusatzbeitrag: {
    help: "Jede Krankenkasse erhebt zusätzlich zum Allgemeinen Beitragssatz (14,6%) einen kassenindividuellen Zusatzbeitrag. Er wird seit 2019 paritätisch zwischen AG und AN geteilt.",
    example: "TK 1,20% → 0,60% AN + 0,60% AG",
  },
  kvBeitrag: {
    help: "Krankenversicherungsbeitrag: 14,6% Allgemeiner Satz + Zusatzbeitrag. Wird bis zur BBG (5.512,50€/Monat in 2025) erhoben und je zur Hälfte von AN und AG gezahlt.",
  },
  rvBeitrag: {
    help: "Rentenversicherungsbeitrag: 18,6% (2025), je zur Hälfte AN/AG. Bis zur BBG (8.050€/Monat West, 7.450€ Ost in 2025).",
  },
  avBeitrag: {
    help: "Arbeitslosenversicherungsbeitrag: 2,6% (2025), je zur Hälfte AN/AG. Wird bis zur BBG der Rentenversicherung erhoben.",
  },
  pvBeitrag: {
    help: "Pflegeversicherungsbeitrag: 3,6% (2025), je zur Hälfte. Kinderlose ab 23 zahlen 0,6% Zuschlag (=4,2%). Eltern mit ≥2 Kindern unter 25: Abschlag 0,25% pro Kind (max. 1,0%).",
    example: "1 Kind: 3,6% | 2 Kinder: 3,35% | 3 Kinder: 3,1% | 4+ Kinder: 2,6%",
  },
  insolvenzgeldumlage: {
    help: "Die U3-Umlage (Insolvenzgeldumlage) finanziert das Insolvenzgeld der Bundesagentur für Arbeit. Sie beträgt 0,06% (2025) und wird ausschließlich vom Arbeitgeber gezahlt.",
  },
  umlageU1: {
    help: "U1-Umlage finanziert die Erstattung der Lohnfortzahlung im Krankheitsfall. Pflicht für Betriebe mit ≤30 Mitarbeitern. Satz variiert je Krankenkasse (1,0%–4,0%).",
  },
  umlageU2: {
    help: "U2-Umlage finanziert die Erstattung von Mutterschutz-Leistungen. Pflicht für ALLE Arbeitgeber, unabhängig von der Größe. Satz ca. 0,3%–0,9%.",
  },
  beitragsgruppen: {
    help: "Beitragsgruppenschlüssel (BGS) sind 4-stellige Codes für SV-Meldungen, die KV/RV/AV/PV-Pflicht eines Mitarbeiters codieren. Beispiel: '1111' = voller AN.",
    example: "1111 = Vollzeit AN, 6500 = Minijob (nur RV-pauschal)",
  },
  kuerzelKVPVAV: {
    help: "Versicherungsformen: KV = Krankenversicherung, RV = Rentenversicherung, AV = Arbeitslosenversicherung, PV = Pflegeversicherung. Zusammen die 'Sozialversicherung'.",
  },

  // ─── Spezielle Sachverhalte ────────────────────────────
  geringverdiener: {
    help: "Auszubildende mit Vergütung ≤ 325€/Monat gelten als Geringverdiener. Der Arbeitgeber trägt dann allein die kompletten SV-Beiträge.",
  },
  uebergangsbereich: {
    help: "Der Übergangsbereich (Midijob, 556,01€ – 2.000€) reduziert den SV-Beitrag des Arbeitnehmers gleitend. Der Arbeitgeber zahlt seinen vollen Anteil.",
  },
  pfandung: {
    help: "Eine Lohnpfändung verpflichtet den Arbeitgeber, einen Teil des Nettos direkt an den Gläubiger zu überweisen. Die Pfändungsfreigrenzen werden alle 2 Jahre angepasst (aktuell: 1.499,99€ ab 1.7.2024).",
    hint: "LohnPro berechnet den pfändbaren Anteil automatisch nach der amtlichen Pfändungstabelle.",
  },
  entgeltfortzahlung: {
    help: "Bei Krankheit hat der AN Anspruch auf 6 Wochen volles Gehalt vom AG (§ 3 EntgFG). Danach übernimmt die Krankenkasse das Krankengeld (~70% des Brutto, max. 90% Netto).",
  },
  mutterschaftsgeld: {
    help: "Schwangere erhalten 6 Wochen vor + 8 Wochen nach der Geburt (=14 Wochen) Mutterschaftsgeld. Krankenkasse zahlt bis 13€/Tag, AG stockt auf das letzte Netto auf.",
  },
  bav15Prozent: {
    help: "Seit 2022 muss der Arbeitgeber 15% Zuschuss zur Entgeltumwandlung (bAV) zahlen, sofern er SV-Beiträge spart. Bei Direktversicherungen meist nicht erforderlich.",
  },
  geldwerterVorteil: {
    help: "Geldwerte Vorteile sind Sachleistungen, die wie Gehalt versteuert werden müssen — z.B. Firmenwagen, kostenlose Mahlzeiten, Wohnung. Sie erhöhen das Brutto, fließen aber nicht real aufs Konto.",
    example: "Firmenwagen 1%-Regel: 40.000€ × 1% = 400€/Monat zusätzliches Brutto",
  },
} as const satisfies Record<string, GlossaryEntry>;
