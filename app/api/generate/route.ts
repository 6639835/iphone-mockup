import sharp from "sharp";

import { loadFrameBuffer } from "@/lib/frames";
import { detectIPhoneModel, IPHONE_MODELS, type Orientation } from "@/lib/iphone-models";
import { composeMockup } from "@/lib/mockup";

export const runtime = "nodejs";
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

function badRequest(detail: string): Response {
  return Response.json({ detail }, { status: 400 });
}

function asNonEmptyString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isOrientation(value: string): value is Orientation {
  return value === "Portrait" || value === "Landscape";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const requestedModel = asNonEmptyString(formData.get("model"));
    const color = asNonEmptyString(formData.get("color"));
    const orientationInput = asNonEmptyString(formData.get("orientation")) || "Portrait";

    if (!(file instanceof File)) {
      return badRequest("Image file is required");
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return Response.json(
        { detail: "Image is too large. Please use a file under 4 MB." },
        { status: 413 }
      );
    }

    if (!color) {
      return badRequest("Color is required");
    }

    if (!isOrientation(orientationInput)) {
      return badRequest("Orientation must be Portrait or Landscape");
    }

    const screenshotBuffer = Buffer.from(await file.arrayBuffer());
    let model = requestedModel;

    if (!model) {
      const metadata = await sharp(screenshotBuffer).metadata();
      if (!metadata.width || !metadata.height) {
        return badRequest("Could not read image dimensions");
      }

      const detection = detectIPhoneModel(metadata.width, metadata.height);
      if (!detection.detectedModel) {
        return badRequest("Could not detect iPhone model");
      }
      model = detection.detectedModel;
    }

    const modelInfo = IPHONE_MODELS[model];
    if (!modelInfo) {
      return badRequest(`Invalid model: ${model}`);
    }

    if (!modelInfo.colors.includes(color)) {
      return badRequest(
        `Invalid color '${color}' for ${model}. Available: ${modelInfo.colors.join(", ")}`
      );
    }

    const frameBuffer = await loadFrameBuffer(model, color, orientationInput);
    if (!frameBuffer) {
      return Response.json(
        { detail: `Frame not found: ${model} - ${color} - ${orientationInput}` },
        { status: 404 }
      );
    }

    const mockupBuffer = await composeMockup(frameBuffer, screenshotBuffer);
    const downloadName = `mockup-${model}-${color}.png`.replace(/\s+/g, "-");

    return new Response(new Uint8Array(mockupBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${downloadName}"`,
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unexpected image processing error";
    return Response.json({ detail: `Error generating mockup: ${detail}` }, { status: 500 });
  }
}
