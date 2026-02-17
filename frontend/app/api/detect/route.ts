import sharp from "sharp";

import { detectIPhoneModel, IPHONE_MODELS } from "@/lib/iphone-models";

export const runtime = "nodejs";

function badRequest(detail: string): Response {
  return Response.json({ detail }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return badRequest("Image file is required");
    }

    const imageBuffer = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(imageBuffer).metadata();

    if (!metadata.width || !metadata.height) {
      return badRequest("Could not read image dimensions");
    }

    const detection = detectIPhoneModel(metadata.width, metadata.height);
    if (!detection.detectedModel) {
      return badRequest(
        "Could not detect iPhone model. Please ensure your screenshot matches iPhone 16 or 17 series dimensions."
      );
    }

    const modelInfo = IPHONE_MODELS[detection.detectedModel];

    return Response.json({
      detected_model: detection.detectedModel,
      all_matches: detection.allMatches,
      colors: modelInfo.colors,
      resolution: [metadata.width, metadata.height],
      series: modelInfo.series,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unexpected image processing error";
    return Response.json({ detail: `Error processing image: ${detail}` }, { status: 500 });
  }
}
