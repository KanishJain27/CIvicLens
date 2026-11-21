// CivicLens — Gemini connectivity test edge function.
// Makes a real server-side request to the Gemini API using the configured
// GEMINI_API_KEY and GEMINI_MODEL secrets, and returns a redacted status
// (never the key). Also persists the result to a temp table so it can be
// read from the database without needing the project URL.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed. Use GET or POST." }, 405);
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash";

  let result: Record<string, unknown> = { connected: false, model, timestamp: new Date().toISOString() };

  // Also report which Supabase env vars are available (redacted, no values).
  result.envPresent = {
    SUPABASE_URL: !!Deno.env.get("SUPABASE_URL"),
    SUPABASE_SERVICE_ROLE_KEY: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    SUPABASE_ANON_KEY: !!Deno.env.get("SUPABASE_ANON_KEY"),
    GEMINI_API_KEY: !!Deno.env.get("GEMINI_API_KEY"),
    GEMINI_MODEL: Deno.env.get("GEMINI_MODEL") || "(not set, will use default)",
  };

  if (!apiKey) {
    result.error = "GEMINI_API_KEY secret is not configured.";
  } else {
    result.keyConfigured = true;
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: "Reply with exactly: PONG" }] }],
            generationConfig: { temperature: 0, maxOutputTokens: 10 },
          }),
        }
      );

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        result.httpStatus = geminiRes.status;
        result.error = errText.slice(0, 300);
      } else {
        const data = await geminiRes.json();
        const reply: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        result.connected = true;
        result.reply = (reply ?? "").trim().slice(0, 50);
      }
    } catch (err) {
      result.error = (err as Error).message.slice(0, 300);
    }
  }

  // Persist result to a temp table so it can be read via SQL.
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (supabaseUrl && serviceKey) {
      await fetch(`${supabaseUrl}/rest/v1/_gemini_ping_result?on_conflict=id`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": serviceKey,
          "Authorization": `Bearer ${serviceKey}`,
          "Prefer": "resolution=merge-duplicates",
        },
        body: JSON.stringify({ id: 1, result }),
      }).catch(() => {});
    }
  } catch {
    // Best-effort persistence; the HTTP response still carries the result.
  }

  return jsonResponse(result, result.connected ? 200 : 502);
});
