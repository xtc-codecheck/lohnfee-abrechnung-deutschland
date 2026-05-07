import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { jobId } = await req.json();
    if (!jobId) return new Response(JSON.stringify({ error: "jobId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } }
    );

    const { data: job, error: jobErr } = await supabase.from("receipt_ocr_jobs").select("*").eq("id", jobId).single();
    if (jobErr || !job) return new Response(JSON.stringify({ error: "job not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Signed URL für das Bild
    const { data: signed } = await supabase.storage.from("receipts").createSignedUrl(job.storage_path, 60);
    if (!signed?.signedUrl) throw new Error("could not sign storage path");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Extrahiere aus dem Beleg: Datum (YYYY-MM-DD), Händler, Brutto-Betrag (EUR), USt-Betrag, Kategorie (lodging|meal|transport|fuel|other). Antworte als JSON." },
          { role: "user", content: [
            { type: "text", text: "Beleg auswerten:" },
            { type: "image_url", image_url: { url: signed.signedUrl } },
          ]},
        ],
      }),
    });
    const aiJson = await aiRes.json();
    const content = aiJson?.choices?.[0]?.message?.content ?? "";
    let extracted: any = {};
    try { extracted = JSON.parse(content.replace(/```json|```/g, "").trim()); } catch { extracted = { raw: content }; }

    await supabase.from("receipt_ocr_jobs").update({
      status: "done", raw_text: content, extracted, processed_at: new Date().toISOString(),
    }).eq("id", jobId);

    if (job.receipt_id && extracted.amount) {
      await supabase.from("travel_receipts").update({
        amount: extracted.amount, vat_amount: extracted.vat ?? 0,
        category: extracted.category ?? "other", description: extracted.merchant ?? null,
        ocr_status: "done",
      }).eq("id", job.receipt_id);
    }

    return new Response(JSON.stringify({ ok: true, extracted }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});