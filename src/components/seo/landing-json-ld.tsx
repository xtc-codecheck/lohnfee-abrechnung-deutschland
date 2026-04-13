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
      name: "Kann ich LohnPro kostenlos testen?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ja! Der Starter-Tarif ist dauerhaft kostenlos und umfasst bis zu 5 Mitarbeiter. Sie können jederzeit auf einen höheren Tarif upgraden.",
      },
    },
    {
      "@type": "Question",
      name: "Sind meine Daten sicher?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Alle Daten werden verschlüsselt in der Cloud gespeichert. Wir setzen auf mandantenspezifische Datenisolation (Row Level Security), DSGVO-konforme Verarbeitung und regelmäßige Sicherheitsaudits.",
      },
    },
    {
      "@type": "Question",
      name: "Unterstützt LohnPro DATEV-Export?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ja, ab dem Professional-Tarif können Sie alle Abrechnungsdaten im DATEV-Format exportieren und direkt an Ihren Steuerberater übergeben.",
      },
    },
    {
      "@type": "Question",
      name: "Welche Branchen werden unterstützt?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "LohnPro bietet spezielle Branchenmodule für Bau (SOKA-BAU), Gastronomie (Sachbezüge) und Pflege (steuerfreie SFN-Zuschläge). Die allgemeine Lohnabrechnung eignet sich für alle Branchen.",
      },
    },
    {
      "@type": "Question",
      name: "Kann ich mehrere Mandanten verwalten?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ja, mit dem Enterprise-Tarif können Sie beliebig viele Mandanten anlegen – ideal für Steuerkanzleien und Lohnbüros.",
      },
    },
    {
      "@type": "Question",
      name: "Wie aktuell sind die Steuer- und SV-Sätze?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Alle Berechnungsgrundlagen werden zeitnah zu jedem Jahreswechsel aktualisiert. Aktuell sind alle Werte für 2026 hinterlegt.",
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
