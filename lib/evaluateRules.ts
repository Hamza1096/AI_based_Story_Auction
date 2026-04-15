export async function evalProposalAgainstRules(proposal: string, rules: string[]): Promise<{ isValid: boolean; reason?: string }> {
  if (!rules || rules.length === 0) {
    return { isValid: true };
  }

  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  if (!apiKey) {
    console.error("GROQ_API_KEY is missing, skipping rule validation.");
    return { isValid: true }; // Fail open if no configuration
  }

  const systemPrompt = `You are a strict rule validator for a story auction game. 
You will be provided with a proposed addition to a story, along with the story's mandatory rules.
Your job is to determine whether the proposal directly violates ANY of the story rules.
If it violates a rule, concisely explain why in 1-2 sentences. 
Respond in JSON format precisely like this: { "isValid": boolean, "reason": "Reason for rejection if invalid, otherwise empty string" }`;

  const userPrompt = `
Story Rules:
${rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}

Proposal:
${proposal}
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
        temperature: 0.1,
        max_tokens: 150,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error("Groq validation failed:", await response.text());
      return { isValid: true }; // Fail open
    }

    const data = await response.json();
    const resultContent = data.choices[0].message.content;
    const parsed = JSON.parse(resultContent);

    if (parsed.isValid === false) {
      return { isValid: false, reason: parsed.reason || "Proposal breaks story rules." };
    }

    return { isValid: true };
  } catch (err) {
    console.error("Error during evaluateRules:", err);
    return { isValid: true }; // Fail open
  }
}
