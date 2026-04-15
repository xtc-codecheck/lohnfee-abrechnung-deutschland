

# Plan: PDF-Upload fur Mitarbeiterdaten

## Analyse

DATEV exportiert Stammdaten als `.txt`-Dateien. PDFs (z.B. Lohnabrechnungen, Personalbogen) enthalten die gleichen Daten, aber unstrukturiert -- sie mussen per OCR/Text-Extraktion geparst werden.

## Zwei mogliche Ansatze

### Option A: PDF-Parsing mit AI (empfohlen)
- PDF hochladen -> Text extrahieren (server-side via Edge Function)
- AI-Modell (Gemini) extrahiert strukturierte Felder (Name, Steuerklasse, SV-Nr, etc.)
- Vorschau der erkannten Daten -> Nutzer bestatigt -> Import

**Vorteil**: Funktioniert mit beliebigen PDF-Formaten (Lohnabrechnungen, DATEV-Auswertungen, Personalbogen)
**Aufwand**: Edge Function + AI-Prompt + Vorschau-UI

### Option B: Einfache PDF-Text-Extraktion
- PDF client-seitig parsen (pdf.js)
- Regex-basierte Erkennung bekannter Felder
- Funktioniert nur mit bekannten PDF-Layouts

**Vorteil**: Kein AI-Kosten, schneller
**Nachteil**: Fragil, nur fur bekannte Formate

## Technische Umsetzung (Option A)

1. **datev-import-wizard.tsx**: `accept` erweitern auf `.txt,.csv,.pdf`
2. **Neue Edge Function** `parse-pdf-employee`: Nimmt PDF entgegen, extrahiert Text, sendet an Gemini mit strukturiertem Prompt
3. **Antwort-Format**: JSON mit erkannten Feldern + Konfidenz-Score
4. **Wizard**: Neuer Zwischenschritt "PDF-Erkennung prufen" mit editierbarer Vorschau
5. **Personalstamm-Upload** (Edit-Dialog): Ebenfalls PDF akzeptieren

## Betroffene Dateien
- `src/components/import/datev-import-wizard.tsx` -- accept + PDF-Pfad
- `supabase/functions/parse-pdf-employee/index.ts` -- neue Edge Function
- `src/components/employees/edit-employee-dialog.tsx` -- PDF im Nachladen-Tab

