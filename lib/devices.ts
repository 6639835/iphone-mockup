export type Orientation = "Portrait" | "Landscape";
export type DeviceKind = "iphone" | "mac";

export interface ScreenRect {
  // Absolute pixel rectangle of the transparent screen cutout inside the frame PNG.
  left: number;
  top: number;
  width: number;
  height: number;
  // Corner radius in pixels, matching the display's rounded corners.
  radius: number;
}

export interface DeviceModel {
  name: string;
  kind: DeviceKind;
  // Native screen resolution in natural orientation (portrait for iPhone, landscape for Mac).
  resolution: [number, number];
  colors: string[];
  // Orientations that have frame assets. iPhone: both. Mac: landscape only.
  orientations: Orientation[];
  // Tie-breaker for iPhones that share a resolution. Undefined for Mac.
  series?: "16" | "17";
  // Exact screen placement for laptop frames. Undefined for iPhones (shared fractional insets).
  screen?: ScreenRect;
}

interface MatchCandidate {
  modelName: string;
  score: number;
  series?: DeviceModel["series"];
}

const IPHONE_ORIENTATIONS: Orientation[] = ["Portrait", "Landscape"];
const MAC_ORIENTATIONS: Orientation[] = ["Landscape"];

export const DEVICE_MODELS: Record<string, DeviceModel> = {
  "iPhone 16": {
    name: "iPhone 16",
    kind: "iphone",
    resolution: [1179, 2556],
    colors: ["Black", "Pink", "Teal", "Ultramarine", "White"],
    orientations: IPHONE_ORIENTATIONS,
    series: "16",
  },
  "iPhone 16 Plus": {
    name: "iPhone 16 Plus",
    kind: "iphone",
    resolution: [1290, 2796],
    colors: ["Black", "Pink", "Teal", "Ultramarine", "White"],
    orientations: IPHONE_ORIENTATIONS,
    series: "16",
  },
  "iPhone 16 Pro": {
    name: "iPhone 16 Pro",
    kind: "iphone",
    resolution: [1206, 2622],
    colors: ["Black Titanium", "Desert Titanium", "Natural Titanium", "White Titanium"],
    orientations: IPHONE_ORIENTATIONS,
    series: "16",
  },
  "iPhone 16 Pro Max": {
    name: "iPhone 16 Pro Max",
    kind: "iphone",
    resolution: [1320, 2868],
    colors: ["Black Titanium", "Desert Titanium", "Natural Titanium", "White Titanium"],
    orientations: IPHONE_ORIENTATIONS,
    series: "16",
  },
  "iPhone 17": {
    name: "iPhone 17",
    kind: "iphone",
    resolution: [1206, 2622],
    colors: ["Black", "Lavender", "Mist Blue", "Sage", "White"],
    orientations: IPHONE_ORIENTATIONS,
    series: "17",
  },
  "iPhone Air": {
    name: "iPhone Air",
    kind: "iphone",
    resolution: [1242, 2700],
    colors: ["Cloud White", "Light Gold", "Sky Blue", "Space Black"],
    orientations: IPHONE_ORIENTATIONS,
    series: "17",
  },
  "iPhone 17 Pro": {
    name: "iPhone 17 Pro",
    kind: "iphone",
    resolution: [1206, 2622],
    colors: ["Cosmic Orange", "Deep Blue", "Silver"],
    orientations: IPHONE_ORIENTATIONS,
    series: "17",
  },
  "iPhone 17 Pro Max": {
    name: "iPhone 17 Pro Max",
    kind: "iphone",
    resolution: [1320, 2868],
    colors: ["Cosmic Orange", "Deep Blue", "Silver"],
    orientations: IPHONE_ORIENTATIONS,
    series: "17",
  },
  // Mac frames are landscape-only. Screen rects were measured from the transparent
  // screen cutout in each Bezel frame PNG and match the native screenshot resolution 1:1.
  // radius is 0: the frame's opaque bezel already defines the (squircle) rounded screen
  // corners, so we fill the whole cutout with the screenshot rather than masking it with a
  // circular radius — a circular mask would over-round the squircle and leave the corners
  // uncovered.
  "MacBook Air M5 13-inch": {
    name: "MacBook Air M5 13-inch",
    kind: "mac",
    resolution: [2560, 1664],
    colors: ["Midnight", "Silver", "Sky Blue", "Starlight"],
    orientations: MAC_ORIENTATIONS,
    screen: { left: 420, top: 288, width: 2560, height: 1664, radius: 0 },
  },
  "MacBook Air M5 15-inch": {
    name: "MacBook Air M5 15-inch",
    kind: "mac",
    resolution: [2880, 1864],
    colors: ["Midnight", "Silver", "Sky Blue", "Starlight"],
    orientations: MAC_ORIENTATIONS,
    screen: { left: 329, top: 218, width: 2880, height: 1864, radius: 0 },
  },
  "MacBook Pro M5 14-inch": {
    name: "MacBook Pro M5 14-inch",
    kind: "mac",
    resolution: [3024, 1964],
    colors: ["Silver", "Space Black"],
    orientations: MAC_ORIENTATIONS,
    screen: { left: 418, top: 288, width: 3024, height: 1964, radius: 0 },
  },
  "MacBook Pro M5 16-inch": {
    name: "MacBook Pro M5 16-inch",
    kind: "mac",
    resolution: [3456, 2234],
    colors: ["Silver", "Space Black"],
    orientations: MAC_ORIENTATIONS,
    screen: { left: 402, top: 303, width: 3456, height: 2234, radius: 0 },
  },
};

export function detectDevice(
  width: number,
  height: number,
  preferSeries: DeviceModel["series"] = "17"
): { detectedModel: string | null; allMatches: string[] } {
  let portraitWidth = width;
  let portraitHeight = height;
  if (portraitWidth > portraitHeight) {
    [portraitWidth, portraitHeight] = [portraitHeight, portraitWidth];
  }

  const exactMatches: MatchCandidate[] = [];

  for (const [modelName, model] of Object.entries(DEVICE_MODELS)) {
    let [expectedWidth, expectedHeight] = model.resolution;
    if (expectedWidth > expectedHeight) {
      [expectedWidth, expectedHeight] = [expectedHeight, expectedWidth];
    }

    if (portraitWidth === expectedWidth && portraitHeight === expectedHeight) {
      exactMatches.push({ modelName, score: 0, series: model.series });
      continue;
    }

    const scaleW = portraitWidth / expectedWidth;
    const scaleH = portraitHeight / expectedHeight;
    const maxScale = Math.max(scaleW, scaleH);
    if (maxScale === 0) {
      continue;
    }

    if (Math.abs(scaleW - scaleH) / maxScale < 0.001) {
      exactMatches.push({
        modelName,
        score: Math.abs(scaleW - 1),
        series: model.series,
      });
    }
  }

  if (exactMatches.length > 0) {
    exactMatches.sort((a, b) => a.score - b.score);
    const bestScore = exactMatches[0].score;
    const similarMatches = exactMatches.filter(
      (match) => Math.abs(match.score - bestScore) < 0.001
    );

    let detectedModel: string;
    if (similarMatches.length > 1) {
      const preferred = similarMatches.find((match) => match.series === preferSeries);
      detectedModel = preferred ? preferred.modelName : similarMatches[0].modelName;
    } else {
      detectedModel = exactMatches[0].modelName;
    }

    return {
      detectedModel,
      allMatches: exactMatches.map((match) => match.modelName),
    };
  }

  const aspectRatio = portraitHeight / portraitWidth;
  const ratioMatches: MatchCandidate[] = [];

  for (const [modelName, model] of Object.entries(DEVICE_MODELS)) {
    let [expectedWidth, expectedHeight] = model.resolution;
    if (expectedWidth > expectedHeight) {
      [expectedWidth, expectedHeight] = [expectedHeight, expectedWidth];
    }
    const expectedRatio = expectedHeight / expectedWidth;
    const ratioDiff = Math.abs(aspectRatio - expectedRatio) / expectedRatio;

    if (ratioDiff < 0.005) {
      ratioMatches.push({
        modelName,
        score: ratioDiff,
        series: model.series,
      });
    }
  }

  if (ratioMatches.length === 0) {
    return { detectedModel: null, allMatches: [] };
  }

  ratioMatches.sort((a, b) => a.score - b.score);
  const bestScore = ratioMatches[0].score;
  const similarMatches = ratioMatches.filter((match) => Math.abs(match.score - bestScore) < 0.0001);

  let detectedModel: string;
  if (similarMatches.length > 1) {
    const preferred = similarMatches.find((match) => match.series === preferSeries);
    detectedModel = preferred ? preferred.modelName : similarMatches[0].modelName;
  } else {
    detectedModel = ratioMatches[0].modelName;
  }

  return {
    detectedModel,
    allMatches: ratioMatches.map((match) => match.modelName),
  };
}
