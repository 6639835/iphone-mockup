import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Orientation } from "@/lib/iphone-models";

const DEFAULT_FRAMES_BASE_URL = "https://pub-7ad0d44bcb4948a2a359b34d35bc8fc8.r2.dev";
const FRAMES_BASE_URL = (process.env.FRAMES_BASE_URL || DEFAULT_FRAMES_BASE_URL)
  .trim()
  .replace(/\/+$/, "");

function frameFilename(model: string, color: string, orientation: Orientation): string {
  return `${model} - ${color} - ${orientation}.png`;
}

async function loadRemoteFrame(
  model: string,
  color: string,
  orientation: Orientation
): Promise<Buffer | null> {
  if (!FRAMES_BASE_URL) {
    return null;
  }

  const filename = frameFilename(model, color, orientation);
  const encodedPath = `${encodeURIComponent(model)}/${encodeURIComponent(filename)}`;
  const frameUrl = `${FRAMES_BASE_URL}/${encodedPath}`;
  const response = await fetch(frameUrl, {
    headers: { "User-Agent": "iphone-mockup-next/1.0" },
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch frame image: HTTP ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function loadLocalFrame(
  model: string,
  color: string,
  orientation: Orientation
): Promise<Buffer | null> {
  const filename = frameFilename(model, color, orientation);
  const localFrameRoots = [
    path.join(process.cwd(), "public", "frames"),
    path.join(process.cwd(), "..", "frames"),
  ];

  for (const frameRoot of localFrameRoots) {
    const framePath = path.join(frameRoot, model, filename);
    try {
      return await readFile(framePath);
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code !== "ENOENT") {
        throw nodeError;
      }
    }
  }

  return null;
}

export async function loadFrameBuffer(
  model: string,
  color: string,
  orientation: Orientation
): Promise<Buffer | null> {
  let remoteError: Error | null = null;

  try {
    const remoteFrame = await loadRemoteFrame(model, color, orientation);
    if (remoteFrame) {
      return remoteFrame;
    }
  } catch (error) {
    remoteError = error instanceof Error ? error : new Error("Failed to load frame");
  }

  const localFrame = await loadLocalFrame(model, color, orientation);
  if (localFrame) {
    return localFrame;
  }

  if (remoteError) {
    throw remoteError;
  }

  return null;
}
