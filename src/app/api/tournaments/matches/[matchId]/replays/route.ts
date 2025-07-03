import { type NextRequest, NextResponse } from "next/server";
import { tournamentGameRepository } from "@/lib/repositories/tournamentGameRepository";
import { createAoe2RecsService } from "@/lib/storage";
import { auth } from "@/server/auth";
import { usersRepository } from "@/lib/repositories/usersRepository";
import JSZip from "jszip";

export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await usersRepository.isUserAdmin(session?.user?.id);

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { matchId } = params;

    // Get games with replays
    const games =
      await tournamentGameRepository.getGamesWithReplaysByMatchId(matchId);

    if (games.length === 0) {
      return NextResponse.json(
        { error: "No replays found for this match" },
        { status: 404 },
      );
    }

    const s3Service = createAoe2RecsService();

    // Create ZIP file with all replays
    const zip = new JSZip();

    // Download each replay file and add to zip
    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      if (!game?.recUrl) continue;

      try {
        // Get file from S3
        const fileBuffer = await s3Service.download(game.recUrl);

        // Extract original filename from the S3 key or create a nice name
        const originalFileName =
          game.recUrl.split("/").pop() ?? `game_${i + 1}_replay.mgz`;

        // Add to zip with a descriptive name
        const zipFileName = `Game_${i + 1}_${game.map?.name || "Unknown_Map"}_${originalFileName}`;
        zip.file(zipFileName, fileBuffer);

        console.log(`Added ${zipFileName} to zip`);
      } catch (error) {
        console.error(`Failed to download replay for game ${game.id}:`, error);
        // Continue with other files even if one fails
      }
    }

    // Generate zip file
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    // Return zip file
    return new NextResponse(zipBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="match_${matchId}_replays.zip"`,
      },
    });
  } catch (error) {
    console.error("Error downloading replays:", error);
    return NextResponse.json(
      { error: "Failed to download replays" },
      { status: 500 },
    );
  }
}
