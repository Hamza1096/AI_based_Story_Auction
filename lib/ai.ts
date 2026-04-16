import { AUCTION_CONFIG } from "./auctionConfig";

/**
 * Synthesizes multiple story parts into a coherent narrative using AI.
 */
export async function synthesizeEpisodeContent(parts: string[], storyContext: { title: string; genre: string; description: string }) {
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

  if (!apiKey || parts.length === 0) {
    return parts.join("\n\n");
  }

  // If there's only one part, maybe we don't need synthesis, but even one part can be polished.
  // However, the cost/latency might not be worth it for a single part unless requested.
  if (parts.length === 1) {
    return parts[0];
  }

  const systemPrompt = `You are an expert ghostwriter and story editor. 
Your task is to take a series of winning story fragments (which were individual daily winning bids) and weave them into a single, seamless, and coherent narrative episode.
Ensure the transitions between fragments are natural and the prose flows elegantly. 
Maintain the original tone and plot points strictly. Do not add major new plot elements, but you may add minor connecting phrases or descriptive texture to ensure coherence.
Output ONLY the final polished narrative. No meta-commentary.`;

  const userPrompt = `
Story Title: ${storyContext.title}
Genre: ${storyContext.genre}
Premise: ${storyContext.description}

Story Fragments to weave together:
${parts.map((p, i) => `Fragment ${i + 1}: ${p}`).join("\n\n")}
`;

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
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      console.error("[AI Synthesis] Groq API error:", await response.text());
      return parts.join("\n\n");
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("[AI Synthesis] Error:", error);
    return parts.join("\n\n");
  }
}
