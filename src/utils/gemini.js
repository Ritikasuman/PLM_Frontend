// Lightweight Gemini/Generative API helper for the frontend.
// Usage: set `VITE_GEMINI_API_KEY` and optionally `VITE_GEMINI_MODEL` and `VITE_GEMINI_BASE_URL` in your env.
// IMPORTANT: For production, do not expose API keys in client-side code. Use a secure backend proxy.

const API_BASE =
  import.meta.env.VITE_GEMINI_BASE_URL ||
  "https://generativelanguage.googleapis.com/v1beta2";
const MODEL = import.meta.env.VITE_GEMINI_MODEL || "models/text-bison-001";
const KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

export async function sendToGemini(prompt, options = {}) {
  if (!KEY) {
    // Don't throw here — frontend consumers can use a null return to fall back
    // to local/canned responses without generating an exception stacktrace.
    console.warn(
      "VITE_GEMINI_API_KEY is not set. Skipping Gemini call and returning null."
    );
    return null;
  }

  const url = `${API_BASE}/${MODEL}:generate?key=${KEY}`;

  const body = {
    prompt: { text: prompt },
    temperature: options.temperature ?? 0.25,
    maxOutputTokens: options.maxOutputTokens ?? 512,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${text}`);
  }

  const data = await res.json();

  // Handle a few possible response shapes from Google Generative APIs.
  // Prefer human-friendly text if available; otherwise fallback to JSON string.
  try {
    if (data.candidates && data.candidates[0]) {
      // older/text-bison shape
      if (typeof data.candidates[0].output === "string")
        return data.candidates[0].output;
      if (data.candidates[0].content)
        return data.candidates[0].content.map((c) => c.text || "").join("");
    }

    if (data.output && Array.isArray(data.output)) {
      return data.output
        .map((o) => (o.content || []).map((c) => c.text || "").join(""))
        .join("\n");
    }

    if (typeof data.text === "string") return data.text;

    return JSON.stringify(data);
  } catch (e) {
    return JSON.stringify(data);
  }
}

export default { sendToGemini };
