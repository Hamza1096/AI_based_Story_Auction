import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "The spirits do not recognize you. Awaken your identity to proceed." }, { status: 401 });
    }

    const { proposal, storyContext } = await req.json();

    if (!proposal || !storyContext) {
      return NextResponse.json({ error: "A spark is missing. The loom cannot weave without a thread." }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "The esoteric artifacts remain unlocked. The grand architect must imbue the key." }, { status: 500 });
    }

    const systemPrompt = `You are an expert creative writer assisting a user in participating in a story auction.
The user has provided a brief proposal.
Your task is to expand this proposal into a compelling, 3-4 sentence paragraph.
Ensure the expansion perfectly matches the provided story's tone, genre, and rules.
Do not include any conversational filler, explanations, or meta-commentary. Output ONLY the expanded story text.
CRITICAL INSTRUCTION: The resulting text MUST be under 450 characters. Keep it concise but impactful.`;

    const userPrompt = `
Story Context:
Title: ${storyContext.title}
Genre: ${storyContext.genre}
Description: ${storyContext.description}
Rules: ${storyContext.rules?.join(", ") || "None"}

User's Brief Proposal:
${proposal}
`;

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
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Groq API error:", err);
      return NextResponse.json({ error: "The ancient scribe lost its focus. Kindle the flame again." }, { status: 500 });
    }

    const data = await response.json();
    const expandedText = data.choices[0].message.content.trim();

    return NextResponse.json({ expandedText }, { status: 200 });
  } catch (error) {
    console.error("AI Expansion Error:", error);
    return NextResponse.json({ error: "A tremor in the void disrupted the weaving. Try again shortly." }, { status: 500 });
  }
}
