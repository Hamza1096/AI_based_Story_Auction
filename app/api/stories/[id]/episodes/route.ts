import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Episode from "@/models/Episode";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();
    
    const episodes = await Episode.find({ storyId: id })
      .sort({ episodeNumber: 1 })
      .lean();

    return NextResponse.json({ episodes }, { status: 200 });
  } catch (error: any) {
    console.error("[EpisodesGET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
