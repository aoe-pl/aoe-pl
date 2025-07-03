import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { createAoe2RecsService } from "@/lib/storage";
import { usersRepository } from "@/lib/repositories/usersRepository";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await usersRepository.isUserAdmin(session.user.id);

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const matchId = formData.get("matchId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!matchId) {
      return NextResponse.json(
        { error: "Match ID is required" },
        { status: 400 },
      );
    }

    // Validate file type
    const allowedExtensions = [".aoe2record", ".mgz", ".mgx"];
    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf("."));
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Only .aoe2record, .mgz, and .mgx files are allowed.",
        },
        { status: 400 },
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Create S3 service
    const s3Service = createAoe2RecsService();

    // Create a unique key for the replay file in temp folder
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const sessionId = session.user.id;
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const tempKey = `temp/${sessionId}/${matchId}/${timestamp}-${sanitizedFileName}`;

    // Upload to S3 in temp location
    await s3Service.upload(tempKey, buffer, {
      contentType: "application/octet-stream",
      metadata: {
        matchId,
        uploadedAt: new Date().toISOString(),
        originalFileName: file.name,
        fileSize: file.size.toString(),
        isTemp: "true",
        userId: sessionId,
      },
    });

    return NextResponse.json({
      success: true,
      tempKey,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}
