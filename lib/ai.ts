import { AUCTION_CONFIG } from "./auctionConfig";

/**
 * Synthesizes multiple story parts into a coherent narrative using AI.
 */
export async function synthesizeEpisodeContent(parts: string[], storyContext: { title: string; genre: string; description: string }) {
  // Check for both possible environment variable names
  const apiKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;

  if (!apiKey) {
    console.warn("[AI Synthesis] Missing GROQ_API_KEY. Falling back to simple concatenation.");
    return parts.join("\n\n");
  }

  if (parts.length === 0) {
    return "";
  }

  // Even for one part, we might want to polish it to fit the title/genre context,
  // but for now we'll just return it if it's the only thread.
  if (parts.length === 1) {
    return parts[0];
  }

  const systemPrompt = `You are an elite literary editor and ghostwriter. 
Your goal is to transform a collection of disjointed story fragments into a single, fluid, and compelling narrative episode.

STRICT GUIDELINES:
1. NARRATIVE FLOW: Transform the fragments into a coherent story. Do NOT just list them. Use professional transitions.
2. CONTEXT: Adhere strictly to the Story Title: "${storyContext.title}", Genre: "${storyContext.genre}", and Premise provided.
3. INTEGRITY: Preserve all key plot points and character actions from the fragments. Do not delete important details.
4. STYLE: Use evocative, immersive prose suitable for the genre.
5. NO META-COMMENTARY: Output only the story text. No "Here is the story" or "I have woven the fragments".`;

  const userPrompt = `
Premise: ${storyContext.description}

Daily Winning Fragments to weave together:
${parts.map((p, i) => `[Fragment ${i + 1}]: ${p}`).join("\n\n")}

WEAVE THEM NOW:`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI Synthesis] Groq API error:", response.status, errorText);
      return parts.join("\n\n");
    }

    const data = await response.json();
    const synthesized = data.choices[0]?.message?.content?.trim();
    
    if (!synthesized) {
      console.error("[AI Synthesis] Empty response from Groq");
      return parts.join("\n\n");
    }

    return synthesized;
  } catch (error) {
    console.error("[AI Synthesis] Unexpected error:", error);
    return parts.join("\n\n");
  }
}
