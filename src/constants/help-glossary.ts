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
} as const satisfies Record<string, GlossaryEntry>;
