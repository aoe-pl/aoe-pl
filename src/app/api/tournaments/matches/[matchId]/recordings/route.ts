import { tournamentGameRepository } from "@/lib/repositories/tournamentGameRepository";
import { createAoe2RecsService } from "@/lib/storage";
import { auth } from "@/server/auth";
import JSZip from "jszip";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Download every recording uploaded for a match as a single ZIP archive.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { matchId } = await params;

    const info = await tournamentGameRepository.getMatchRecordingsInfo(matchId);

    if (!info) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const s3Service = createAoe2RecsService();
    const { objects } = await s3Service.list({ prefix: info.prefix });

    if (objects.length === 0) {
      return NextResponse.json(
        { error: "No recordings found for this match" },
        { status: 404 },
      );
    }

    const zip = new JSZip();

    await Promise.all(
      objects.map(async (object) => {
        try {
          const fileBuffer = await s3Service.download(object.key);
          const fileName = object.key.split("/").pop() ?? object.key;
          zip.file(fileName, fileBuffer);
        } catch (error) {
          console.error("Failed to download recording:", object.key, error);
        }
      }),
    );

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${info.fileName}.zip"`,
      },
    });
  } catch (error) {
    console.error("Error downloading recordings:", error);
    return NextResponse.json(
      { error: "Failed to download recordings" },
      { status: 500 },
    );
  }
}
