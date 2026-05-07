/**
 * sv-net-submit
 * ─────────────────────────────────────────────────────────────
 * Provider-Adapter für SV-Meldungs-Übermittlung.
 *
 * Im Standalone-Betrieb: Stub-Quittung (kein echter Versand).
 * In Phase 4 wird hier die produktive sv.net- bzw.
 * dakota.le-Anbindung implementiert (sobald ITSG-Zertifikat
 * und Provider-Credentials vorliegen).
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SubmitBody {
  protocol: "svnet" | "dakota" | "itsg";
  meldungType: "DEUEV" | "BNW" | "EEL" | "BEA" | "AAG" | "UV-DSLN";
  payloadXml: string;
  empfaengerBbnr?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as SubmitBody;
    if (!body?.payloadXml || !body?.meldungType || !body?.protocol) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stub-Quittung – produktive Anbindung folgt in Phase 4.
    const ticketId = "STUB-" +
      crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();

    return new Response(
      JSON.stringify({
        ticketId,
        acceptedAt: new Date().toISOString(),
        status: "accepted",
        message:
          `Stub-Quittung erzeugt (${body.protocol}/${body.meldungType}). ` +
          `Produktiver Versand erfordert ITSG-Zertifizierung.`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});