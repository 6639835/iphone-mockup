import { IPHONE_MODELS } from "@/lib/iphone-models";

export const runtime = "nodejs";

export async function GET() {
  const models = Object.fromEntries(
    Object.entries(IPHONE_MODELS).map(([modelName, modelInfo]) => [
      modelName,
      {
        name: modelInfo.name,
        resolution: modelInfo.resolution,
        colors: modelInfo.colors,
        series: modelInfo.series,
      },
    ])
  );

  return Response.json({ models });
}
