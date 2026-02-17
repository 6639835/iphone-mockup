export interface IPhoneModel {
  name: string;
  resolution: [number, number];
  colors: string[];
  series: "16" | "17";
}

export type Orientation = "Portrait" | "Landscape";

interface MatchCandidate {
  modelName: string;
  score: number;
  series: IPhoneModel["series"];
}

export const IPHONE_MODELS: Record<string, IPhoneModel> = {
  "iPhone 16": {
    name: "iPhone 16",
    resolution: [1179, 2556],
    colors: ["Black", "Pink", "Teal", "Ultramarine", "White"],
    series: "16",
  },
  "iPhone 16 Plus": {
    name: "iPhone 16 Plus",
    resolution: [1290, 2796],
    colors: ["Black", "Pink", "Teal", "Ultramarine", "White"],
    series: "16",
  },
  "iPhone 16 Pro": {
    name: "iPhone 16 Pro",
    resolution: [1206, 2622],
    colors: ["Black Titanium", "Desert Titanium", "Natural Titanium", "White Titanium"],
    series: "16",
  },
  "iPhone 16 Pro Max": {
    name: "iPhone 16 Pro Max",
    resolution: [1320, 2868],
    colors: ["Black Titanium", "Desert Titanium", "Natural Titanium", "White Titanium"],
    series: "16",
  },
  "iPhone 17": {
    name: "iPhone 17",
    resolution: [1206, 2622],
    colors: ["Black", "Lavender", "Mist Blue", "Sage", "White"],
    series: "17",
  },
  "iPhone Air": {
    name: "iPhone Air",
    resolution: [1242, 2700],
    colors: ["Cloud White", "Light Gold", "Sky Blue", "Space Black"],
    series: "17",
  },
  "iPhone 17 Pro": {
    name: "iPhone 17 Pro",
    resolution: [1206, 2622],
    colors: ["Cosmic Orange", "Deep Blue", "Silver"],
    series: "17",
  },
  "iPhone 17 Pro Max": {
    name: "iPhone 17 Pro Max",
    resolution: [1320, 2868],
    colors: ["Cosmic Orange", "Deep Blue", "Silver"],
    series: "17",
  },
};

export function detectIPhoneModel(
  width: number,
  height: number,
  preferSeries: IPhoneModel["series"] = "17"
): { detectedModel: string | null; allMatches: string[] } {
  let portraitWidth = width;
  let portraitHeight = height;
  if (portraitWidth > portraitHeight) {
    [portraitWidth, portraitHeight] = [portraitHeight, portraitWidth];
  }

  const exactMatches: MatchCandidate[] = [];

  for (const [modelName, model] of Object.entries(IPHONE_MODELS)) {
    const [expectedWidth, expectedHeight] = model.resolution;

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

  for (const [modelName, model] of Object.entries(IPHONE_MODELS)) {
    const [expectedWidth, expectedHeight] = model.resolution;
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
