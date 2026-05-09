import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

/**
 * DATEV-Connect-Online Transfer (Stub)
 * ────────────────────────────────────
 * Simuliert den digitalen Belegaustausch via DATEV Connect Online.
 * In Produktion würde hier per OAuth2/REST gegen
 *   https://api.datev.de/connect-online/v1/...
 * ein Transfer-Bündel (Lohn-Journal, Belege, FiBu) übergeben.
 *
 * Diese Stub-Implementierung legt einen Eintrag in
 * `datev_connect_transfers` an, simuliert das Routing
 * und liefert ein "external_ticket" zurück.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { tenantId, transferType, payrollPeriodId, documents } = await req.json();
    if (!tenantId || !transferType) {
      return new Response(JSON.stringify({ error: "tenantId and transferType required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
    );

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id ?? null;

    const ticket = `DCO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const docCount = Array.isArray(documents) ? documents.length : 0;

    const { data: row, error } = await supabase.from("datev_connect_transfers").insert({
      tenant_id: tenantId,
      transfer_type: transferType,
      status: "transmitted", // Stub: wir tun so, als sei der Versand erfolgt
      external_ticket: ticket,
      document_count: docCount,
      initiated_by: userId,
      completed_at: new Date().toISOString(),
      payload_summary: { payrollPeriodId: payrollPeriodId ?? null, documents: documents ?? [] },
    }).select().single();

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, transfer: row, ticket }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});