import sharp from "sharp";

const DEFAULT_LEFT_INSET = 0.05;
const DEFAULT_RIGHT_INSET = 0.05;
const DEFAULT_TOP_INSET = 0.025;
const DEFAULT_BOTTOM_INSET = 0.025;
const DEFAULT_RADIUS = 0.1;

function roundedRectMaskSvg(width: number, height: number, radius: number): Buffer {
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="white" />
    </svg>
  `;
  return Buffer.from(svg);
}

export async function composeMockup(
  frameBuffer: Buffer,
  screenshotBuffer: Buffer,
  leftInset: number = DEFAULT_LEFT_INSET,
  rightInset: number = DEFAULT_RIGHT_INSET,
  topInset: number = DEFAULT_TOP_INSET,
  bottomInset: number = DEFAULT_BOTTOM_INSET,
  radius: number = DEFAULT_RADIUS
): Promise<Buffer> {
  const normalizedFrameBuffer = await sharp(frameBuffer).ensureAlpha().png().toBuffer();
  const frameMetadata = await sharp(normalizedFrameBuffer).metadata();
  const frameWidth = frameMetadata.width;
  const frameHeight = frameMetadata.height;

  if (!frameWidth || !frameHeight) {
    throw new Error("Invalid frame image");
  }

  const left = Math.round(frameWidth * leftInset);
  const right = frameWidth - Math.round(frameWidth * rightInset);
  const top = Math.round(frameHeight * topInset);
  const bottom = frameHeight - Math.round(frameHeight * bottomInset);

  const viewportWidth = right - left;
  const viewportHeight = bottom - top;

  if (viewportWidth <= 0 || viewportHeight <= 0) {
    throw new Error("Invalid insets: viewport has non-positive size");
  }

  const fittedScreenshot = await sharp(screenshotBuffer)
    .rotate()
    .ensureAlpha()
    .resize(viewportWidth, viewportHeight, {
      fit: "cover",
      position: "centre",
    })
    .png()
    .toBuffer();

  const radiusPx = Math.max(
    0,
    Math.min(
      Math.round(Math.min(viewportWidth, viewportHeight) * radius),
      Math.floor(Math.min(viewportWidth, viewportHeight) / 2)
    )
  );

  const maskedScreenshot = await sharp(fittedScreenshot)
    .composite([
      {
        input: roundedRectMaskSvg(viewportWidth, viewportHeight, radiusPx),
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();

  const screenshotLayer = await sharp({
    create: {
      width: frameWidth,
      height: frameHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: maskedScreenshot, left, top }])
    .png()
    .toBuffer();

  return sharp(screenshotLayer)
    .composite([{ input: normalizedFrameBuffer, blend: "over" }])
    .png()
    .toBuffer();
}
