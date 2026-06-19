import { DEVICE_MODELS } from "@/lib/devices";

export const runtime = "nodejs";

export async function GET() {
  const models = Object.fromEntries(
    Object.entries(DEVICE_MODELS).map(([modelName, modelInfo]) => [
      modelName,
      {
        name: modelInfo.name,
        kind: modelInfo.kind,
        resolution: modelInfo.resolution,
        colors: modelInfo.colors,
        orientations: modelInfo.orientations,
        series: modelInfo.series ?? null,
      },
    ])
  );

  return Response.json({ models });
}
