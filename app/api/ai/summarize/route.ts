import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "The spirits do not recognize you. Awaken your identity to proceed." }, { status: 401 });
    }

    const { content } = await req.json();

    if (!content) {
      return NextResponse.json({ error: "No content provided to summarize." }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "The esoteric artifacts remain unlocked. The grand architect must imbue the key." }, { status: 500 });
    }

    const systemPrompt = `You are an expert editor participating in a story auction platform.
A user wants to see a concise summary of a story episode (which may be long and formed by multiple winning bids).
Your task is to summarize the provided episode text into a much shorter, engaging version.
Ensure the summary maintains the original tone. Do not include any conversational filler, explanations, or meta-commentary. Output ONLY the summarized text.`;

    const userPrompt = `
Episode Content:
${content}
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
    const summaryText = data.choices[0].message.content.trim();

    return NextResponse.json({ summaryText }, { status: 200 });
  } catch (error) {
    console.error("AI Summarize Error:", error);
    return NextResponse.json({ error: "A tremor in the void disrupted the reading. Try again shortly." }, { status: 500 });
  }
}
