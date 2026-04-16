import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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

/**
 * PATCH /api/stories/[id]
 * Updates a story (currently only supporting `blacklist`).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const p = await params;
    const { id } = p;

    if (!id) {
      return NextResponse.json({ error: "Story ID is required." }, { status: 400 });
    }

    const body = await request.json();
    const { blacklist } = body;

    await connectToDatabase();

    const story = await Story.findById(id);

    if (!story) {
      return NextResponse.json({ error: "Story not found." }, { status: 404 });
    }

    if (story.author.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden. You are not the author of this story." }, { status: 403 });
    }

    // Blacklist: comma-separated string converted to array OR an array
    let sanitisedBlacklist: string[] = [];
    if (typeof blacklist === "string") {
      sanitisedBlacklist = blacklist.split(",").map((k) => k.trim().toLowerCase()).filter((k) => k.length > 0);
    } else if (Array.isArray(blacklist)) {
      sanitisedBlacklist = blacklist.map((k) => k.trim().toLowerCase()).filter((k) => k.length > 0);
    } else {
      sanitisedBlacklist = story.blacklist; // Unchanged if not provided
    }

    story.blacklist = sanitisedBlacklist;
    await story.save();

    return NextResponse.json({ story, message: "Story updated successfully" }, { status: 200 });
  } catch (error) {
    console.error(`[PATCH /api/stories/[id]]`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
