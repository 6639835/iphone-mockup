export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    status: "ok",
    message: "iPhone Mockup API (Next.js)",
  });
}
