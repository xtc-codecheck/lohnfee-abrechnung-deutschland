import { Helmet } from "react-helmet-async";

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LohnPro",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Professionelle Lohnabrechnungssoftware für deutsche Unternehmen mit automatisierter Brutto-Netto-Berechnung, DATEV-Export und SV-Meldungen.",
  offers: [
    {
      "@type": "Offer",
      name: "Starter",
      price: "0",
      priceCurrency: "EUR",
      description: "Bis zu 5 Mitarbeiter, kostenlos",
    },
    {
      "@type": "Offer",
      name: "Professional",
      price: "49",
      priceCurrency: "EUR",
      description: "Bis zu 50 Mitarbeiter, monatlich",
    },
    {
      "@type": "Offer",
      name: "Enterprise",
      price: "149",
      priceCurrency: "EUR",
      description: "Unbegrenzte Mitarbeiter, monatlich",
    },
  ],
  featureList: [
    "Automatisierte Brutto-Netto-Berechnung",
    "DATEV-Export",
    "SV-Meldungen",
    "Multi-Tenant-Verwaltung",
    "Branchenmodule (Bau, Gastro, Pflege)",
    "DSGVO-konform",
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Ist LohnPro kostenlos?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ja! Der Starter-Tarif ist dauerhaft kostenlos fuer bis zu 5 Mitarbeiter. Sie brauchen keine Kreditkarte und koennen jederzeit auf einen hoeherern Tarif wechseln.",
      },
    },
    {
      "@type": "Question",
      name: "Muss ich mich mit Steuern auskennen?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Nein! LohnPro berechnet Lohnsteuer, Sozialversicherung und alle Abzuege automatisch nach den aktuellen gesetzlichen Vorgaben. Sie geben nur die Mitarbeiterdaten ein.",
      },
    },
    {
      "@type": "Question",
      name: "Sind meine Daten sicher?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ja. Alle Daten werden verschluesselt gespeichert. Jede Firma hat einen eigenen, vollstaendig abgeschotteten Datenbereich. Niemand kann auf Daten anderer Firmen zugreifen.",
      },
    },
    {
      "@type": "Question",
      name: "Kann mein Steuerberater die Daten nutzen?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ja, mit dem DATEV-Export koennen Sie Ihre Abrechnungsdaten herunterladen und direkt an Ihren Steuerberater weitergeben. Er kann die Datei in seine Software einlesen.",
      },
    },
    {
      "@type": "Question",
      name: "Welche Branchen werden unterstuetzt?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "LohnPro eignet sich fuer alle Branchen. Zusaetzlich gibt es spezielle Module fuer Bau, Gastronomie und Pflege mit branchenspezifischen Berechnungen.",
      },
    },
    {
      "@type": "Question",
      name: "Kann ich mehrere Firmen verwalten?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ja! Mit dem Enterprise-Tarif koennen Sie beliebig viele Firmen (Mandanten) anlegen. Ideal fuer Unternehmer mit mehreren Betrieben.",
      },
    },
  ],
};

export function LandingJsonLd() {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(softwareSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
    </Helmet>
  );
}
