import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { synthesizeEpisodeContent } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fragments, storyContext } = await req.json();

    if (!fragments || !Array.isArray(fragments) || fragments.length === 0 || !storyContext) {
      return NextResponse.json({ error: "Missing required data for synthesis" }, { status: 400 });
    }

    const synthesizedText = await synthesizeEpisodeContent(fragments, storyContext);

    return NextResponse.json({ synthesizedText }, { status: 200 });
  } catch (error) {
    console.error("AI Synthesis Error:", error);
    return NextResponse.json({ error: "Synthesis failed" }, { status: 500 });
  }
}
