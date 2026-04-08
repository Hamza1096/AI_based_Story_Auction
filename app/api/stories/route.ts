import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/mongodb";
import Story from "@/models/Story";

/**
 * GET /api/stories
 * Returns stories. Supports query params:
 *   ?mine=true  — only stories authored by the current user
 *   ?status=active|completed|paused — filter by status
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const mine = searchParams.get("mine") === "true";
    const status = searchParams.get("status");

    const filter: Record<string, unknown> = {};

    if (mine) {
      filter.author = session.user.id;
    }

    if (status && ["active", "completed", "paused"].includes(status)) {
      filter.status = status;
    }

    const stories = await Story.find(filter).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ stories }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/stories]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/stories
 * Create a new story. Author must be authenticated.
 * Body: { title, genre, description, rules? }
 *
 * Acceptance criteria:
 *  - Author must be logged in ✓
 *  - Story requires title, genre, description ✓
 *  - Author can define rules ✓
 *  - Story is saved and becomes visible ✓
 *  - Description cannot be edited after creation (enforced — not included in PATCH) ✓
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, genre, description, rules } = body;

    // --- Validation ---
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    if (title.trim().length > 120) {
      return NextResponse.json({ error: "Title must be 120 characters or fewer." }, { status: 400 });
    }

    const allowedGenres = [
      "Fantasy", "Science Fiction", "Mystery", "Romance", "Horror",
      "Thriller", "Adventure", "Historical Fiction", "Comedy", "Drama", "Other",
    ];
    if (!genre || !allowedGenres.includes(genre)) {
      return NextResponse.json({ error: "A valid genre is required." }, { status: 400 });
    }

    if (!description || typeof description !== "string" || description.trim().length < 20) {
      return NextResponse.json(
        { error: "Description is required and must be at least 20 characters." },
        { status: 400 }
      );
    }

    // Rules: array of non-empty strings, max 10 rules
    const sanitisedRules: string[] = Array.isArray(rules)
      ? rules
          .map((r: unknown) => (typeof r === "string" ? r.trim() : ""))
          .filter((r) => r.length > 0)
          .slice(0, 10)
      : [];

    await connectToDatabase();

    const story = await Story.create({
      title: title.trim(),
      genre,
      description: description.trim(),
      rules: sanitisedRules,
      author: session.user.id,
      authorName: session.user.name || "Anonymous",
      status: "active",
    });

    return NextResponse.json({ story }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/stories]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
