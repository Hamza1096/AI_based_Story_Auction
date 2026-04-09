import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Story from "@/models/Story";

/**
 * GET /api/stories/[id]
 * Retrieves a single story by its ID.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const p = await params;
    const { id } = p;

    if (!id) {
      return NextResponse.json({ error: "Story ID is required." }, { status: 400 });
    }

    await connectToDatabase();

    const story = await Story.findById(id).lean();

    if (!story) {
      return NextResponse.json({ error: "Story not found." }, { status: 404 });
    }

    return NextResponse.json({ story }, { status: 200 });
  } catch (error) {
    console.error(`[GET /api/stories/[id]]`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
