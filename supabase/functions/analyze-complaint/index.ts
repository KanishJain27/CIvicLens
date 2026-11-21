// CivicLens — secure AI complaint analysis edge function.
//
// Calls the Google Gemini API server-side so the API key stays on the server
// and is never exposed to the browser. The frontend talks to this function
// via the Supabase Edge Function URL; the function returns the structured
// `ComplaintAnalysis` JSON (see src/types/complaint.ts).
//
// Required secret: GEMINI_API_KEY (configure in Supabase project secrets).
// Optional secret: GEMINI_MODEL (defaults to "gemini-2.0-flash").
//
// Request body:  { "description": string, "image"?: string (data URL | http URL) }
// Response 200:  ComplaintAnalysis JSON
// Response 4xx/5xx: { "error": string }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DEFAULT_MODEL = "gemini-2.0-flash";

const SYSTEM_INSTRUCTION = `You are CivicLens, an AI assistant that analyzes citizen civic complaints for Indian municipalities.

You will receive a complaint that may be written in English or a regional Indian language (Hindi, Marathi, Tamil, Telugu, Bengali, Kannada, Malayalam, Gujarati, Punjabi, Urdu, Odia, Assamese, etc.). It may also include an optional photograph.

Analyze the complaint and return ONLY a JSON object with EXACTLY these fields (no markdown, no commentary, no wrapping):

{
  "originalLanguage": "<detected language name in English, e.g. English, Hindi, Marathi>",
  "translatedSummary": "<English translation or concise summary, max 2 sentences>",
  "category": "<one of: Roads and potholes | Waste management | Water supply and leakage | Electricity and streetlights | Trees and fallen branches | Drainage and sewage | Other>",
  "severity": "<one of: Critical | High | Medium | Low>",
  "severityReason": "<one short sentence explaining the severity based on actual risk>",
  "department": "<one of: Roads and Engineering | Solid Waste Management | Water Supply Department | Electrical Department | Parks and Horticulture | Stormwater and Drainage | Municipal General Complaints>",
  "suggestedAction": "<one short sentence with a concrete next step for the department>",
  "confidence": "<one of: High | Medium | Low>"
}

Severity guidelines:
- Critical: immediate danger to life, safety, or major infrastructure failure. Examples: exposed live wire near people/school, open manhole on a busy road, fallen live tree blocking a main road, sewage flooding a home.
- High: serious risk likely to cause injury or significant damage soon. Examples: large pothole causing accidents, complete water outage in an area, streetlight out on a dark crossing.
- Medium: notable inconvenience or moderate risk. Examples: overflowing garbage, water leakage on a street, partial drainage blockage.
- Low: minor nuisance with low risk. Examples: a small pothole, a single non-hazardous fallen branch, intermittent low water pressure.

Rules:
- Never invent information not supported by the complaint text or photo.
- Never exaggerate severity. When unsure, prefer the lower severity.
- If a photo is provided, use it as supporting evidence only; do not hallucinate details beyond what is visible or stated.
- "department" MUST match the category mapping: Roads->Roads and Engineering, Waste->Solid Waste Management, Water->Water Supply Department, Electricity->Electrical Department, Trees->Parks and Horticulture, Drainage->Stormwater and Drainage, Other->Municipal General Complaints.
- "confidence" reflects how certain you are about category and severity, not a score.
- Output MUST be valid JSON with exactly those 9 keys. No trailing commas, no extra keys.`;

interface AnalyzeRequest {
  description?: string;
  image?: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Convert an image (data URL or http URL) into a Gemini part. */
async function imagePart(image: string): Promise<Record<string, unknown>> {
  // Data URL: data:image/jpeg;base64,....
  if (image.startsWith("data:")) {
    const match = image.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error("Invalid image data URL");
    const [, mimeType, base64] = match;
    return {
      inline_data: { mime_type: mimeType, data: base64 },
    };
  }
  // HTTP(S) URL — pass as file_data (Gemini fetches it).
  return {
    file_data: { file_uri: image, mime_type: "image/jpeg" },
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed. Use POST." }, 405);
  }

  try {
    let body: AnalyzeRequest;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body." }, 400);
    }

    const description = (body.description ?? "").trim();
    if (!description) {
      return jsonResponse({ error: "description is required." }, 400);
    }
    if (description.length > 5000) {
      return jsonResponse({ error: "description too long (max 5000 chars)." }, 400);
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return jsonResponse(
        { error: "AI service is not configured. Missing GEMINI_API_KEY secret." },
        503
      );
    }
    const model = Deno.env.get("GEMINI_MODEL") || DEFAULT_MODEL;

    const parts: unknown[] = [{ text: description }];
    if (body.image && typeof body.image === "string") {
      try {
        parts.push(await imagePart(body.image));
      } catch (e) {
        // Image failed to parse — analyze text-only rather than failing the whole call.
        console.warn("analyze-complaint: image parse failed:", (e as Error).message);
      }
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents: [{ role: "user", parts }],
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            maxOutputTokens: 800,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error", geminiRes.status, errText);
      return jsonResponse(
        { error: "AI analysis failed. Please try again later." },
        502
      );
    }

    const geminiJson = await geminiRes.json();
    const text: string | undefined =
      geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return jsonResponse(
        { error: "AI returned no analysis. Please retry." },
        502
      );
    }

    // Gemini with responseMimeType=application/json returns pure JSON,
    // but be defensive: strip any stray code fences.
    const cleaned = text.replace(/^```json\s*|\s*```$/g, "").trim();
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return jsonResponse(
        { error: "AI returned malformed analysis. Please retry." },
        502
      );
    }

    return jsonResponse(parsed, 200);
  } catch (err) {
    console.error("analyze-complaint error:", err);
    return jsonResponse(
      { error: "Unexpected server error during analysis." },
      500
    );
  }
});
