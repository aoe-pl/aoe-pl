import { tournamentGameRepository } from "@/lib/repositories/tournamentGameRepository";
import { createAoe2RecsService } from "@/lib/storage";
import { sanitizeFileName } from "@/lib/storage/paths";
import { auth } from "@/server/auth";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Download a single recording file of a game.
 *
 * A restored game is stored as several files; the caller picks one with the
 * `file` query parameter (default 0). The file is named
 * "<player1>_<player2>_game_<n>" (with a "_<k>" suffix for the extra files).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string; gameNumber: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { matchId, gameNumber: gameNumberParam } = await params;
    const gameNumber = Number(gameNumberParam);

    if (!Number.isInteger(gameNumber) || gameNumber < 1) {
      return NextResponse.json(
        { error: "Invalid game number" },
        { status: 400 },
      );
    }

    const fileIndex = Number(request.nextUrl.searchParams.get("file") ?? 0);

    if (!Number.isInteger(fileIndex) || fileIndex < 0) {
      return NextResponse.json(
        { error: "Invalid file index" },
        { status: 400 },
      );
    }

    const info = await tournamentGameRepository.getMatchRecordingsInfo(matchId);

    if (!info) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const keys =
      await tournamentGameRepository.getMatchRecordingKeysByGameNumber(
        matchId,
        gameNumber,
      );

    const key = keys[fileIndex];

    if (!key) {
      return NextResponse.json(
        { error: "No recording for this game" },
        { status: 404 },
      );
    }

    const s3Service = createAoe2RecsService();
    const fileBuffer = await s3Service.download(key);

    const extension = key.split(".").pop() ?? "aoe2record";
    const suffix = fileIndex > 0 ? `_${fileIndex + 1}` : "";
    const fileName = `${sanitizeFileName(
      `${info.playerBaseName}_game_${gameNumber}${suffix}`,
    )}.${extension}`;

    return new NextResponse(fileBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error downloading recording:", error);
    return NextResponse.json(
      { error: "Failed to download recording" },
      { status: 500 },
    );
  }
}
