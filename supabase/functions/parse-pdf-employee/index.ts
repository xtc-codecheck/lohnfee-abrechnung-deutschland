import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "Keine Datei hochgeladen" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert to base64 using Deno's built-in encoder to avoid stack overflow
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Use Deno's standard base64 encoding
    const { encode } = await import("https://deno.land/std@0.168.0/encoding/base64.ts");
    const base64 = encode(bytes);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Du bist ein spezialisierter Datenextraktor für deutsche Lohnabrechnungen und Personalstammdaten.
Extrahiere aus dem PDF-Dokument alle erkennbaren Mitarbeiter-Stammdaten.

Antworte NUR mit dem Tool-Call, keine zusätzlichen Erklärungen.`;

    const userPrompt = `Analysiere dieses PDF-Dokument und extrahiere alle erkennbaren Mitarbeiterdaten.
Suche nach: Vorname, Nachname, Personalnummer, Steuerklasse, Steuer-ID, SV-Nummer, Bruttolohn, 
Krankenkasse, IBAN, BIC, Geburtsdatum, Eintrittsdatum, Adresse (Straße, PLZ, Ort, Bundesland), 
Beschäftigungsart, Wochenstunden, Religionszugehörigkeit, Kinderfreibeträge.

Für jedes erkannte Feld gib einen confidence-Score (0.0-1.0) an.
Wenn mehrere Mitarbeiter im Dokument sind, extrahiere alle.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${base64}`,
                },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_employees",
              description: "Extrahierte Mitarbeiterdaten aus dem PDF-Dokument",
              parameters: {
                type: "object",
                properties: {
                  employees: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        firstName: { type: "string", description: "Vorname" },
                        firstName_confidence: { type: "number" },
                        lastName: { type: "string", description: "Nachname" },
                        lastName_confidence: { type: "number" },
                        personalNumber: { type: "string", description: "Personalnummer" },
                        personalNumber_confidence: { type: "number" },
                        taxClass: { type: "string", description: "Steuerklasse (I-VI)" },
                        taxClass_confidence: { type: "number" },
                        taxId: { type: "string", description: "Steuer-ID (11-stellig)" },
                        taxId_confidence: { type: "number" },
                        svNumber: { type: "string", description: "Sozialversicherungsnummer" },
                        svNumber_confidence: { type: "number" },
                        grossSalary: { type: "number", description: "Bruttogehalt in Euro" },
                        grossSalary_confidence: { type: "number" },
                        healthInsurance: { type: "string", description: "Krankenkasse" },
                        healthInsurance_confidence: { type: "number" },
                        iban: { type: "string", description: "IBAN" },
                        iban_confidence: { type: "number" },
                        bic: { type: "string", description: "BIC" },
                        bic_confidence: { type: "number" },
                        dateOfBirth: { type: "string", description: "Geburtsdatum (YYYY-MM-DD)" },
                        dateOfBirth_confidence: { type: "number" },
                        entryDate: { type: "string", description: "Eintrittsdatum (YYYY-MM-DD)" },
                        entryDate_confidence: { type: "number" },
                        street: { type: "string" },
                        zipCode: { type: "string" },
                        city: { type: "string" },
                        state: { type: "string", description: "Bundesland-Kürzel (z.B. BY, NW)" },
                        employmentType: { type: "string", enum: ["fulltime", "parttime", "minijob", "midijob"] },
                        weeklyHours: { type: "number" },
                        religion: { type: "string" },
                        childrenAllowance: { type: "number" },
                      },
                      required: ["firstName", "lastName"],
                    },
                  },
                  documentType: {
                    type: "string",
                    description: "Art des Dokuments (z.B. Lohnabrechnung, Personalbogen, DATEV-Auswertung)",
                  },
                },
                required: ["employees", "documentType"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_employees" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate-Limit erreicht. Bitte versuchen Sie es später erneut." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Kontingent erschöpft. Bitte Guthaben aufladen." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "PDF-Analyse fehlgeschlagen" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ error: "Keine Daten im PDF erkannt", employees: [], documentType: "unbekannt" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(extracted), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-pdf-employee error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
