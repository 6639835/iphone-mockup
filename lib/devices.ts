export type Orientation = "Portrait" | "Landscape";
export type DeviceKind = "iphone" | "ipad" | "watch" | "mac" | "imac" | "display" | "tv";

export interface ScreenRect {
  // Absolute pixel rectangle of the transparent screen cutout inside the frame PNG.
  // Measured per frame; equals the device's native screenshot resolution and position.
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface DeviceModel {
  name: string;
  kind: DeviceKind;
  // Native screen resolution in natural orientation (portrait for handhelds, landscape for
  // laptops/desktops/displays). Used to detect the model from a screenshot's pixel size.
  resolution: [number, number];
  colors: string[];
  // Orientations that have frame assets.
  orientations: Orientation[];
  // Tie-breaker for iPhones that share a resolution. Undefined for everything else.
  series?: "16" | "17" | "18";
  // Exact screen placement per orientation. Older iPhones use shared fractional insets;
  // newer phones, watches, tablets, and computers provide measured rects.
  screens?: Partial<Record<Orientation, ScreenRect>>;
}

interface MatchCandidate {
  modelName: string;
  score: number;
  series?: DeviceModel["series"];
}

const BOTH_ORIENTATIONS: Orientation[] = ["Portrait", "Landscape"];
const LANDSCAPE_ONLY: Orientation[] = ["Landscape"];

export const DEVICE_MODELS: Record<string, DeviceModel> = {
  // ----- iPhone (16, 17 & 18 series) -----
  "iPhone 16": {
    name: "iPhone 16",
    kind: "iphone",
    resolution: [1179, 2556],
    colors: ["Black", "Pink", "Teal", "Ultramarine", "White"],
    orientations: BOTH_ORIENTATIONS,
    series: "16",
  },
  "iPhone 16 Plus": {
    name: "iPhone 16 Plus",
    kind: "iphone",
    resolution: [1290, 2796],
    colors: ["Black", "Pink", "Teal", "Ultramarine", "White"],
    orientations: BOTH_ORIENTATIONS,
    series: "16",
  },
  "iPhone 16 Pro": {
    name: "iPhone 16 Pro",
    kind: "iphone",
    resolution: [1206, 2622],
    colors: ["Black Titanium", "Desert Titanium", "Natural Titanium", "White Titanium"],
    orientations: BOTH_ORIENTATIONS,
    series: "16",
  },
  "iPhone 16 Pro Max": {
    name: "iPhone 16 Pro Max",
    kind: "iphone",
    resolution: [1320, 2868],
    colors: ["Black Titanium", "Desert Titanium", "Natural Titanium", "White Titanium"],
    orientations: BOTH_ORIENTATIONS,
    series: "16",
  },
  "iPhone 17": {
    name: "iPhone 17",
    kind: "iphone",
    resolution: [1206, 2622],
    colors: ["Black", "Lavender", "Mist Blue", "Sage", "White"],
    orientations: BOTH_ORIENTATIONS,
    series: "17",
  },
  "iPhone Air": {
    name: "iPhone Air",
    kind: "iphone",
    resolution: [1242, 2700],
    colors: ["Cloud White", "Light Gold", "Sky Blue", "Space Black"],
    orientations: BOTH_ORIENTATIONS,
    series: "17",
  },
  "iPhone 17 Pro": {
    name: "iPhone 17 Pro",
    kind: "iphone",
    resolution: [1206, 2622],
    colors: ["Cosmic Orange", "Deep Blue", "Silver"],
    orientations: BOTH_ORIENTATIONS,
    series: "17",
  },
  "iPhone 17 Pro Max": {
    name: "iPhone 17 Pro Max",
    kind: "iphone",
    resolution: [1320, 2868],
    colors: ["Cosmic Orange", "Deep Blue", "Silver"],
    orientations: BOTH_ORIENTATIONS,
    series: "17",
  },
  "iPhone 18 Pro": {
    name: "iPhone 18 Pro",
    kind: "iphone",
    resolution: [1206, 2622],
    colors: ["Black", "Burgundy", "Glacier", "Silver"],
    orientations: BOTH_ORIENTATIONS,
    series: "18",
    screens: {
      Portrait: { left: 72, top: 69, width: 1206, height: 2622 },
      Landscape: { left: 69, top: 72, width: 2622, height: 1206 },
    },
  },
  "iPhone 18 Pro Max": {
    name: "iPhone 18 Pro Max",
    kind: "iphone",
    resolution: [1320, 2868],
    colors: ["Black", "Burgundy", "Glacier", "Silver"],
    orientations: BOTH_ORIENTATIONS,
    series: "18",
    screens: {
      Portrait: { left: 75, top: 66, width: 1320, height: 2868 },
      Landscape: { left: 66, top: 76, width: 2868, height: 1320 },
    },
  },
  "iPhone Duo Inner Open": {
    name: "iPhone Duo Inner Open",
    kind: "iphone",
    resolution: [2007, 2853],
    colors: ["Night Sky", "Star White"],
    orientations: BOTH_ORIENTATIONS,
    series: "18",
    screens: {
      Portrait: { left: 120, top: 120, width: 2007, height: 2853 },
      Landscape: { left: 120, top: 120, width: 2853, height: 2007 },
    },
  },
  "iPhone Duo Outer Closed": {
    name: "iPhone Duo Outer Closed",
    kind: "iphone",
    resolution: [1398, 2034],
    colors: ["Night Sky", "Star White"],
    orientations: BOTH_ORIENTATIONS,
    series: "18",
    screens: {
      Portrait: { left: 88, top: 80, width: 1398, height: 2034 },
      Landscape: { left: 80, top: 88, width: 2034, height: 1398 },
    },
  },
  "iPhone Duo Outer Open": {
    name: "iPhone Duo Outer Open",
    kind: "iphone",
    resolution: [1398, 2034],
    colors: ["Night Sky", "Star White"],
    orientations: ["Portrait"],
    series: "18",
    screens: {
      Portrait: { left: 1570, top: 80, width: 1398, height: 2034 },
    },
  },

  // ----- Apple Watch -----
  "Apple Watch Series 11 42mm": {
    name: "Apple Watch Series 11 42mm",
    kind: "watch",
    resolution: [374, 446],
    colors: [
      "Aluminum Jet Black + Sport Band Black",
      "Aluminum Jet Black + Sport Loop Dark Gray",
      "Aluminum Rose Gold + Sport Band Light Blush",
      "Aluminum Rose Gold + Sport Loop Purple Fog",
      "Aluminum Silver + Sport Band Neon Yellow",
      "Aluminum Silver + Sport Band Purple Fog",
      "Aluminum Silver + Sport Loop Forest",
      "Aluminum Silver + Sport Loop Neon Yellow",
      "Aluminum Space Gray + Sport Band Anchor Blue",
      "Aluminum Space Gray + Sport Band Black",
      "Aluminum Space Gray + Sport Loop Anchor Blue",
      "Aluminum Space Gray + Sport Loop Forest",
      "Titanium Gold + Magnetic Link Sage Gray",
      "Titanium Gold + Milanese Loop",
      "Titanium Gold + Sport Band Light Blush",
      "Titanium Gold + Sport Band Purple Fog",
      "Titanium Natural + Magnetic Link Caramel",
      "Titanium Natural + Milanese Loop",
      "Titanium Natural + Sport Band Stone Gray",
      "Titanium Slate + Magnetic Link Navy",
      "Titanium Slate + Milanese Loop",
      "Titanium Slate + Sport Band Black",
    ],
    orientations: ["Portrait"],
    screens: { Portrait: { left: 73, top: 177, width: 374, height: 446 } },
  },
  "Apple Watch Series 11 46mm": {
    name: "Apple Watch Series 11 46mm",
    kind: "watch",
    resolution: [416, 496],
    colors: [
      "Aluminum Jet Black + Sport Band Black",
      "Aluminum Jet Black + Sport Loop Dark Gray",
      "Aluminum Rose Gold + Sport Band Light Blush",
      "Aluminum Rose Gold + Sport Loop Purple Fog",
      "Aluminum Silver + Sport Band Neon Yellow",
      "Aluminum Silver + Sport Band Purple Fog",
      "Aluminum Silver + Sport Loop Forest",
      "Aluminum Silver + Sport Loop Neon Yellow",
      "Aluminum Space Gray + Sport Band Anchor Blue",
      "Aluminum Space Gray + Sport Band Black",
      "Aluminum Space Gray + Sport Loop Anchor Blue",
      "Aluminum Space Gray + Sport Loop Forest",
      "Titanium Gold + Magnetic Link Sage Gray",
      "Titanium Gold + Milanese Loop",
      "Titanium Gold + Sport Band Light Blush",
      "Titanium Gold + Sport Band Purple Fog",
      "Titanium Natural + Magnetic Link Caramel",
      "Titanium Natural + Milanese Loop",
      "Titanium Natural + Sport Band Stone Gray",
      "Titanium Slate + Magnetic Link Navy",
      "Titanium Slate + Milanese Loop",
      "Titanium Slate + Sport Band Black",
    ],
    orientations: ["Portrait"],
    screens: { Portrait: { left: 72, top: 192, width: 416, height: 496 } },
  },
  "Apple Watch Ultra 2 (2024)": {
    name: "Apple Watch Ultra 2 (2024)",
    kind: "watch",
    resolution: [410, 502],
    colors: [
      "Black + Alpine Loop Dark Green",
      "Black + Alpine Loop Navy",
      "Black + Alpine Loop Tan",
      "Black + Ocean Band Black",
      "Black + Ocean Band Ice Blue",
      "Black + Ocean Band Navy",
      "Black + Titanium Milanese Loop",
      "Black + Trail Loop Black",
      "Black + Trail Loop Blue",
      "Black + Trail Loop Green",
      "Natural + Alpine Loop Dark Green",
      "Natural + Alpine Loop Navy",
      "Natural + Alpine Loop Tan",
      "Natural + Ocean Band Black",
      "Natural + Ocean Band Ice Blue",
      "Natural + Ocean Band Navy",
      "Natural + Titanium Milanese Loop",
      "Natural + Trail Loop Black",
      "Natural + Trail Loop Blue",
    ],
    orientations: ["Portrait"],
    screens: { Portrait: { left: 95, top: 219, width: 410, height: 502 } },
  },
  "Apple Watch Ultra 3 (2025)": {
    name: "Apple Watch Ultra 3 (2025)",
    kind: "watch",
    resolution: [422, 514],
    colors: [
      "Black + Alpine Loop Black",
      "Black + Alpine Loop Light Blue",
      "Black + Milanese Loop",
      "Black + Ocean Band Anchor Blue",
      "Black + Ocean Band Black",
      "Black + Trail Loop Black Charcoal",
      "Natural + Alpine Loop Light Blue",
      "Natural + Alpine Loop Terra Cotta",
      "Natural + Milanese Loop",
      "Natural + Ocean Band Anchor Blue",
      "Natural + Ocean Band Neon Green",
      "Natural + Trail Loop Blue Bright Blue",
      "Natural + Trail Loop Green Neon",
    ],
    orientations: ["Portrait"],
    screens: { Portrait: { left: 89, top: 223, width: 422, height: 514 } },
  },

  // ----- iPad -----
  // Screen rects measured from the transparent cutout in each Bezel frame (per orientation).
  "iPad (A16)": {
    name: "iPad (A16)",
    kind: "ipad",
    resolution: [2360, 1640],
    colors: ["Blue", "Pink", "Silver", "Yellow"],
    orientations: BOTH_ORIENTATIONS,
    screens: {
      Landscape: { left: 200, top: 200, width: 2360, height: 1639 },
      Portrait: { left: 200, top: 200, width: 1639, height: 2360 },
    },
  },
  "iPad mini (A17 Pro)": {
    name: "iPad mini (A17 Pro)",
    kind: "ipad",
    resolution: [2266, 1488],
    colors: ["Blue", "Purple", "Space Gray", "Starlight"],
    orientations: BOTH_ORIENTATIONS,
    screens: {
      Landscape: { left: 142, top: 146, width: 2266, height: 1488 },
      Portrait: { left: 146, top: 142, width: 1488, height: 2266 },
    },
  },
  "iPad Air 11-inch (M4)": {
    name: "iPad Air 11-inch (M4)",
    kind: "ipad",
    resolution: [2360, 1640],
    colors: ["Blue", "Purple", "Space Gray", "Starlight"],
    orientations: BOTH_ORIENTATIONS,
    screens: {
      Landscape: { left: 130, top: 130, width: 2360, height: 1640 },
      Portrait: { left: 130, top: 130, width: 1640, height: 2360 },
    },
  },
  "iPad Air 13-inch (M4)": {
    name: "iPad Air 13-inch (M4)",
    kind: "ipad",
    resolution: [2732, 2048],
    colors: ["Blue", "Purple", "Space Gray", "Starlight"],
    orientations: BOTH_ORIENTATIONS,
    screens: {
      Landscape: { left: 124, top: 126, width: 2732, height: 2048 },
      Portrait: { left: 126, top: 124, width: 2048, height: 2732 },
    },
  },
  "iPad Pro (M5) 11-inch": {
    name: "iPad Pro (M5) 11-inch",
    kind: "ipad",
    resolution: [2420, 1668],
    colors: ["Silver", "Space Black"],
    orientations: BOTH_ORIENTATIONS,
    screens: {
      Landscape: { left: 110, top: 106, width: 2420, height: 1668 },
      Portrait: { left: 106, top: 110, width: 1668, height: 2420 },
    },
  },
  "iPad Pro (M5) 13-inch": {
    name: "iPad Pro (M5) 13-inch",
    kind: "ipad",
    resolution: [2752, 2064],
    colors: ["Silver", "Space Black"],
    orientations: BOTH_ORIENTATIONS,
    screens: {
      Landscape: { left: 124, top: 118, width: 2752, height: 2064 },
      Portrait: { left: 118, top: 124, width: 2064, height: 2752 },
    },
  },

  // ----- Mac laptops (landscape only) -----
  // radius is irrelevant: the bezel defines the (squircle) rounded screen corners, so we fill
  // the whole cutout rather than masking with a circular radius (which would over-round it).
  "MacBook Air M5 13-inch": {
    name: "MacBook Air M5 13-inch",
    kind: "mac",
    resolution: [2560, 1664],
    colors: ["Midnight", "Silver", "Sky Blue", "Starlight"],
    orientations: LANDSCAPE_ONLY,
    screens: { Landscape: { left: 420, top: 288, width: 2560, height: 1664 } },
  },
  "MacBook Air M5 15-inch": {
    name: "MacBook Air M5 15-inch",
    kind: "mac",
    resolution: [2880, 1864],
    colors: ["Midnight", "Silver", "Sky Blue", "Starlight"],
    orientations: LANDSCAPE_ONLY,
    screens: { Landscape: { left: 329, top: 218, width: 2880, height: 1864 } },
  },
  "MacBook Pro M5 14-inch": {
    name: "MacBook Pro M5 14-inch",
    kind: "mac",
    resolution: [3024, 1964],
    colors: ["Silver", "Space Black"],
    orientations: LANDSCAPE_ONLY,
    screens: { Landscape: { left: 418, top: 288, width: 3024, height: 1964 } },
  },
  "MacBook Pro M5 16-inch": {
    name: "MacBook Pro M5 16-inch",
    kind: "mac",
    resolution: [3456, 2234],
    colors: ["Silver", "Space Black"],
    orientations: LANDSCAPE_ONLY,
    screens: { Landscape: { left: 402, top: 303, width: 3456, height: 2234 } },
  },
  "MacBook Neo": {
    name: "MacBook Neo",
    kind: "mac",
    resolution: [2408, 1506],
    colors: ["Blush", "Citrus", "Indigo", "Silver"],
    orientations: LANDSCAPE_ONLY,
    screens: { Landscape: { left: 406, top: 297, width: 2408, height: 1506 } },
  },

  // ----- Desktops & displays (landscape only) -----
  "iMac M4 24-inch": {
    name: "iMac M4 24-inch",
    kind: "imac",
    resolution: [4480, 2520],
    colors: ["Blue", "Green", "Orange", "Pink", "Purple", "Silver", "Yellow"],
    orientations: LANDSCAPE_ONLY,
    screens: { Landscape: { left: 140, top: 150, width: 4480, height: 2520 } },
  },
  "Studio Display": {
    name: "Studio Display",
    kind: "display",
    resolution: [5120, 2880],
    colors: ["Dark", "Light"],
    orientations: LANDSCAPE_ONLY,
    screens: { Landscape: { left: 140, top: 140, width: 5120, height: 2880 } },
  },
  "Studio Display XDR": {
    name: "Studio Display XDR",
    kind: "display",
    resolution: [5120, 2880],
    colors: ["Dark", "Light"],
    orientations: LANDSCAPE_ONLY,
    screens: { Landscape: { left: 140, top: 140, width: 5120, height: 2880 } },
  },
  "Apple TV 4K": {
    name: "Apple TV 4K",
    kind: "tv",
    resolution: [3840, 2160],
    colors: ["Black"],
    orientations: LANDSCAPE_ONLY,
    screens: { Landscape: { left: 103, top: 119, width: 3840, height: 2160 } },
  },
};

export function detectDevice(
  width: number,
  height: number,
  preferSeries: DeviceModel["series"] = "18"
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
