import { createAoe2RecsService } from "@/lib/storage";
import { db } from "@/server/db";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Publicly serve a tournament banner image from the shared storage bucket.
 *
 * The tournament list is public, so the banner must be reachable without
 * authentication. The bucket itself is private, therefore we proxy the object
 * through this handler using the key stored on the tournament.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const tournament = await db.tournament.findUnique({
    where: { id },
    select: { imageKey: true },
  });

  if (!tournament?.imageKey) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const s3Service = createAoe2RecsService();
    const [metadata, fileBuffer] = await Promise.all([
      s3Service.getMetadata(tournament.imageKey),
      s3Service.download(tournament.imageKey),
    ]);

    return new NextResponse(fileBuffer as BodyInit, {
      headers: {
        "Content-Type": metadata.contentType ?? "application/octet-stream",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error serving tournament banner:", error);
    return new NextResponse("Failed to load image", { status: 500 });
  }
}
