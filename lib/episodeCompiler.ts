import connectToDatabase from "@/lib/mongodb";
import Story from "@/models/Story";
import Proposal from "@/models/Proposal";
import Episode from "@/models/Episode";
import { synthesizeEpisodeContent } from "./ai";

/**
 * Synchronizes the episodes for a given story.
 * Recompiles weeks from daily winners, filling gaps automatically.
 */
export async function syncEpisodesForStory(storyId: string) {
  try {
    await connectToDatabase();
    
    const story = await Story.findById(storyId).lean();
    if (!story) return;

    const proposals = await Proposal.find({ storyId, status: "winner" })
      .sort({ createdAt: 1 })
      .lean();
      
    // Helper to align dates to PKT boundaries
    const getPktDate = (date: Date) => new Date(date.getTime() + 5 * 60 * 60 * 1000);
    const getStartOfDay = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

    const storyStartPkt = getPktDate(new Date(story.createdAt));
    const storyStartDay = getStartOfDay(storyStartPkt);
    
    const nowPkt = getPktDate(new Date());
    const today = getStartOfDay(nowPkt);
    
    // Day 1 is the day the story was created.
    const totalDaysPassed = Math.floor((today.getTime() - storyStartDay.getTime()) / 86400000) + 1;

    // Group winners by day
    const winnersByDay = new Map<number, any>();
    for (const p of proposals) {
      const pPkt = getPktDate(new Date(p.createdAt));
      const pDay = getStartOfDay(pPkt);
      const dayNumber = Math.max(1, Math.floor((pDay.getTime() - storyStartDay.getTime()) / 86400000) + 1);
      
      if (!winnersByDay.has(dayNumber)) {
        winnersByDay.set(dayNumber, p);
      }
    }

    const totalEpisodes = Math.ceil(totalDaysPassed / 7);
    
    // Generate / sync episodes
    for (let ep = 1; ep <= totalEpisodes; ep++) {
      const startDay = (ep - 1) * 7 + 1;
      const endDay = ep * 7;
      
      // An episode is fully published if the CURRENT day is > its endDay
      const isPublished = totalDaysPassed > endDay;
      const status = isPublished ? "published" : "draft";
      
      const parts = [];
      const winningTexts: string[] = [];
      
      for (let day = startDay; day <= endDay; day++) {
        // A day has historically closed if our current day index is strictly > day
        const isDayClosed = totalDaysPassed > day;
        
        if (isDayClosed) {
          // Reconstruct the start date for this day (in UTC equivalent to PKT midnight)
          const dayDate = new Date(storyStartDay.getTime() + (day - 1) * 86400000 - 5 * 60 * 60 * 1000);
          
          if (winnersByDay.has(day)) {
            const winner = winnersByDay.get(day);
            parts.push({
              dayNumber: day,
              date: dayDate,
              text: winner.content,
              type: "winner",
              proposalId: winner._id
            });
            winningTexts.push(winner.content);
          } else {
            parts.push({
              dayNumber: day,
              date: dayDate,
              text: "[...]",
              type: "gap"
            });
          }
        }
      }
      
      if (parts.length > 0) {
        // Synthesize the content if there are winners
        let finalContent = "";
        if (winningTexts.length > 0) {
          // We call the AI to weave these together. This covers both published and draft episodes.
          finalContent = await synthesizeEpisodeContent(winningTexts, {
            title: story.title as string,
            genre: story.genre as string,
            description: story.description as string
          });
        } else {
          finalContent = ""; // Leave empty if no winners yet, UI handles this state
        }

        await Episode.findOneAndUpdate(
          { storyId, episodeNumber: ep },
          {
            $set: {
              parts,
              status,
              content: finalContent
            }
          },
          { upsert: true, new: true }
        );
      }
    }
  } catch (error) {
    console.error("[EpisodeCompiler] Sync failed:", error);
  }
}

