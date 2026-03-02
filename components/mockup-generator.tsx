"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Download, Loader2, Smartphone, Upload } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { detectIPhoneModel, IPHONE_MODELS, type Orientation } from "@/lib/iphone-models";

interface DetectionResult {
  detected_model: string;
  all_matches: string[];
  colors: string[];
  resolution: [number, number];
  series: string;
  orientation: Orientation;
}

interface BatchItem {
  id: string;
  originalName: string;
  file: File;
  previewUrl: string;
  detection: DetectionResult;
  selectedColor: string;
  status: "ready" | "processing" | "done" | "failed";
  mockupUrl: string | null;
  error: string | null;
}

type Step = "upload" | "configure" | "results";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const TARGET_UPLOAD_BYTES = Math.floor(MAX_UPLOAD_BYTES * 0.95);
const MAX_UPLOAD_LABEL = "4 MB";
const BATCH_CONCURRENCY = 3;

function uploadTooLargeMessage(): string {
  return `Image is too large. Please use a file under ${MAX_UPLOAD_LABEL}.`;
}

function slugifyFilename(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

function stripExtension(filename: string): string {
  const index = filename.lastIndexOf(".");
  return index > 0 ? filename.slice(0, index) : filename;
}

function buildDownloadName(item: BatchItem): string {
  const baseName = stripExtension(item.originalName);
  const parts = [
    "mockup",
    slugifyFilename(item.detection.detected_model),
    slugifyFilename(item.selectedColor),
    slugifyFilename(baseName),
  ].filter(Boolean);

  return `${parts.join("-") || "mockup"}.png`;
}

function acceptedImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) {
    return true;
  }

  return /\.(heic|heif)$/i.test(file.name);
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read the selected image."));
    };

    image.src = objectUrl;
  });
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Image conversion failed."));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      quality
    );
  });
}

async function optimizeUploadFile(file: File): Promise<File> {
  if (file.size <= TARGET_UPLOAD_BYTES) {
    return file;
  }

  const image = await loadImageElement(file);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not process image for upload.");
  }

  context.drawImage(image, 0, 0);

  let quality = 0.92;
  let blob = await canvasToJpegBlob(canvas, quality);

  while (blob.size > TARGET_UPLOAD_BYTES && quality > 0.5) {
    quality -= 0.08;
    blob = await canvasToJpegBlob(canvas, quality);
  }

  if (blob.size > TARGET_UPLOAD_BYTES) {
    throw new Error(uploadTooLargeMessage());
  }

  return new File([blob], `${stripExtension(file.name)}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

async function parseErrorDetail(response: Response, fallback: string): Promise<string> {
  if (response.status === 413) {
    return uploadTooLargeMessage();
  }

  const contentType = response.headers.get("content-type") ?? "";
  const body = (await response.text()).trim();

  if (!body) {
    return fallback;
  }

  if (contentType.includes("application/json")) {
    try {
      const parsed = JSON.parse(body) as { detail?: unknown };
      if (typeof parsed.detail === "string" && parsed.detail.trim().length > 0) {
        return parsed.detail;
      }
    } catch {
      // Fall through to plain-text response handling.
    }
  }

  return body;
}

async function detectFromImage(file: File): Promise<DetectionResult> {
  const image = await loadImageElement(file);
  const width = image.naturalWidth;
  const height = image.naturalHeight;

  const detection = detectIPhoneModel(width, height);
  if (!detection.detectedModel) {
    throw new Error(
      "Could not detect iPhone model. Please ensure your screenshot matches iPhone 16 or 17 series dimensions."
    );
  }

  const modelInfo = IPHONE_MODELS[detection.detectedModel];
  if (!modelInfo) {
    throw new Error("Detected model is not supported.");
  }

  return {
    detected_model: detection.detectedModel,
    all_matches: detection.allMatches,
    colors: modelInfo.colors,
    resolution: [width, height],
    series: modelInfo.series,
    orientation: width > height ? "Landscape" : "Portrait",
  };
}

export function MockupGenerator() {
  const [step, setStep] = useState<Step>("upload");
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());
  const batchItemsRef = useRef<BatchItem[]>([]);

  useEffect(() => {
    batchItemsRef.current = batchItems;
  }, [batchItems]);

  const createObjectUrl = useCallback((blob: Blob | File): string => {
    const url = URL.createObjectURL(blob);
    objectUrlsRef.current.add(url);
    return url;
  }, []);

  const revokeObjectUrl = useCallback((url: string | null | undefined) => {
    if (!url) {
      return;
    }

    URL.revokeObjectURL(url);
    objectUrlsRef.current.delete(url);
  }, []);

  const clearBatch = useCallback(() => {
    for (const item of batchItemsRef.current) {
      revokeObjectUrl(item.previewUrl);
      revokeObjectUrl(item.mockupUrl);
    }
    setBatchItems([]);
  }, [revokeObjectUrl]);

  useEffect(
    () => () => {
      for (const url of objectUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
      objectUrlsRef.current.clear();
    },
    []
  );

  const completedCount = batchItems.filter((item) => item.status === "done").length;
  const failedCount = batchItems.filter((item) => item.status === "failed").length;
  const processingCount = batchItems.filter((item) => item.status === "processing").length;

  const handleFileSelect = useCallback(
    async (selectedFiles: FileList | File[]) => {
      const candidateFiles = Array.from(selectedFiles).filter(acceptedImageFile);
      if (candidateFiles.length === 0) {
        setError("Please select at least one valid image file.");
        return;
      }

      clearBatch();
      setError(null);
      setIsDetecting(true);

      const nextItems: BatchItem[] = [];
      const skippedMessages: string[] = [];

      for (const [index, selectedFile] of candidateFiles.entries()) {
        try {
          const optimizedFile = await optimizeUploadFile(selectedFile);
          const detection = await detectFromImage(optimizedFile);
          const defaultColor = detection.colors[0];

          if (!defaultColor) {
            skippedMessages.push(`${selectedFile.name}: no available colors for this model.`);
            continue;
          }

          nextItems.push({
            id: `${Date.now()}-${index}-${selectedFile.name}`,
            originalName: selectedFile.name,
            file: optimizedFile,
            previewUrl: createObjectUrl(optimizedFile),
            detection,
            selectedColor: defaultColor,
            status: "ready",
            mockupUrl: null,
            error: null,
          });
        } catch (err) {
          skippedMessages.push(
            `${selectedFile.name}: ${
              err instanceof Error ? err.message : "Failed to prepare this screenshot."
            }`
          );
        }
      }

      if (nextItems.length === 0) {
        setBatchItems([]);
        setStep("upload");
        setError(skippedMessages[0] ?? "No valid screenshots were uploaded.");
      } else {
        setBatchItems(nextItems);
        setStep("configure");
        if (skippedMessages.length > 0) {
          const previewErrors = skippedMessages.slice(0, 3).join(" ");
          const suffix = skippedMessages.length > 3 ? ` (+${skippedMessages.length - 3} more)` : "";
          setError(`Some files were skipped. ${previewErrors}${suffix}`);
        }
      }

      setIsDetecting(false);
    },
    [clearBatch, createObjectUrl]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files.length > 0) {
        void handleFileSelect(e.dataTransfer.files);
      }
    },
    [handleFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        void handleFileSelect(e.target.files);
        e.target.value = "";
      }
    },
    [handleFileSelect]
  );

  const handleColorChange = (id: string, color: string) => {
    setBatchItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== id) {
          return item;
        }

        return {
          ...item,
          selectedColor: color,
          status: "ready",
          error: null,
        };
      })
    );
  };

  const handleDownload = (item: BatchItem) => {
    if (!item.mockupUrl) {
      return;
    }

    const a = document.createElement("a");
    a.href = item.mockupUrl;
    a.download = buildDownloadName(item);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const requestMockup = useCallback(
    async (item: BatchItem): Promise<string> => {
      const formData = new FormData();
      formData.append("file", item.file);
      formData.append("model", item.detection.detected_model);
      formData.append("color", item.selectedColor);
      formData.append("orientation", item.detection.orientation);

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const message = await parseErrorDetail(response, "Failed to generate mockup");
        throw new Error(message);
      }

      const blob = await response.blob();
      return createObjectUrl(blob);
    },
    [createObjectUrl]
  );

  const handleGenerateBatch = useCallback(async () => {
    if (batchItems.length === 0) {
      return;
    }

    setError(null);
    setIsGeneratingBatch(true);

    for (const item of batchItems) {
      revokeObjectUrl(item.mockupUrl);
    }

    const queuedItems = batchItems.map((item) => ({
      ...item,
      status: "processing" as const,
      mockupUrl: null,
      error: null,
    }));

    setBatchItems(queuedItems);

    let queueIndex = 0;
    const workerCount = Math.min(BATCH_CONCURRENCY, queuedItems.length);
    const workers = Array.from({ length: workerCount }, async () => {
      while (queueIndex < queuedItems.length) {
        const currentIndex = queueIndex;
        queueIndex += 1;
        const currentItem = queuedItems[currentIndex];
        if (!currentItem) {
          continue;
        }

        try {
          const mockupUrl = await requestMockup(currentItem);
          setBatchItems((existingItems) =>
            existingItems.map((item) =>
              item.id === currentItem.id
                ? { ...item, status: "done", mockupUrl, error: null }
                : item
            )
          );
        } catch (err) {
          const detail = err instanceof Error ? err.message : "Failed to generate mockup";
          setBatchItems((existingItems) =>
            existingItems.map((item) =>
              item.id === currentItem.id
                ? { ...item, status: "failed", error: detail, mockupUrl: null }
                : item
            )
          );
        }
      }
    });

    await Promise.all(workers);
    setStep("results");
    setIsGeneratingBatch(false);
  }, [batchItems, requestMockup, revokeObjectUrl]);

  const handleDownloadAll = () => {
    const readyItems = batchItems.filter((item) => item.mockupUrl);
    for (const [index, item] of readyItems.entries()) {
      window.setTimeout(() => handleDownload(item), index * 140);
    }
  };

  const handleReset = () => {
    clearBatch();
    setStep("upload");
    setError(null);
    setIsGeneratingBatch(false);
    setIsDetecting(false);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Batch Mockup Processor</CardTitle>
          <CardDescription>Upload one or more iPhone screenshots to process together</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Upload Step */}
          {step === "upload" && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="relative flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 transition-colors hover:border-neutral-400 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
            >
              <input
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                onChange={handleFileInput}
                className="absolute inset-0 cursor-pointer opacity-0"
              />

              {isDetecting ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-neutral-400" />
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Preparing screenshots...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-center">
                  <Upload className="h-12 w-12 text-neutral-400" />
                  <div>
                    <p className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                      Drop screenshots here
                    </p>
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                      or click to browse multiple files
                    </p>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-500">
                    Supports PNG, JPG, HEIC (iPhone 16 & 17 series). Up to 4 MB per image.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Batch Configuration Step */}
          {step === "configure" && batchItems.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-lg bg-neutral-100 p-4 dark:bg-neutral-800">
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {batchItems.length} screenshot{batchItems.length > 1 ? "s" : ""} ready
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Pick a frame color for each screenshot, then process the batch.
                  </p>
                </div>
                <Button onClick={handleReset} variant="outline" size="sm">
                  Clear Batch
                </Button>
              </div>

              <div className="space-y-4">
                {batchItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <img
                        src={item.previewUrl}
                        alt={`Preview: ${item.originalName}`}
                        className="h-28 w-auto rounded object-contain"
                      />
                      <div className="flex-1">
                        <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                          {item.originalName}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                          <Smartphone className="h-4 w-4" />
                          <span>{item.detection.detected_model}</span>
                          <span>·</span>
                          <span>
                            {item.detection.resolution[0]} × {item.detection.resolution[1]}
                          </span>
                          <span>·</span>
                          <span>{item.detection.orientation}</span>
                        </div>

                        {item.detection.all_matches.length > 1 && (
                          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-500">
                            Also matches:{" "}
                            {item.detection.all_matches
                              .filter((model) => model !== item.detection.detected_model)
                              .join(", ")}
                          </p>
                        )}

                        <div className="mt-3 max-w-xs">
                          <label
                            htmlFor={`color-${item.id}`}
                            className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400"
                          >
                            Device color
                          </label>
                          <select
                            id={`color-${item.id}`}
                            value={item.selectedColor}
                            onChange={(e) => handleColorChange(item.id, e.target.value)}
                            disabled={isGeneratingBatch}
                            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                          >
                            {item.detection.colors.map((color) => (
                              <option key={color} value={color}>
                                {color}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={handleGenerateBatch}
                  className="flex-1"
                  size="lg"
                  disabled={isGeneratingBatch || batchItems.length === 0}
                >
                  {isGeneratingBatch ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing Batch...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Process Batch
                    </>
                  )}
                </Button>
                <Button onClick={handleReset} variant="outline" size="lg">
                  Start Over
                </Button>
              </div>

              {isGeneratingBatch && (
                <div className="rounded-lg bg-neutral-100 p-4 dark:bg-neutral-800">
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">
                    Processed {completedCount + failedCount} / {batchItems.length} screenshots.
                  </p>
                  {failedCount > 0 && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      {failedCount} screenshot{failedCount > 1 ? "s" : ""} failed.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Results Step */}
          {step === "results" && batchItems.length > 0 && (
            <div className="space-y-6">
              <div className="rounded-lg bg-neutral-100 p-4 dark:bg-neutral-800">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Completed: {completedCount} / {batchItems.length}
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Failed: {failedCount}
                  {processingCount > 0 ? ` · In progress: ${processingCount}` : ""}
                </p>
              </div>

              <div className="space-y-4">
                {batchItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <img
                          src={item.mockupUrl ?? item.previewUrl}
                          alt={`Result: ${item.originalName}`}
                          className="h-28 w-auto rounded object-contain"
                        />
                        <div>
                          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                            {item.originalName}
                          </p>
                          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                            {item.detection.detected_model} · {item.selectedColor}
                          </p>
                          {item.status === "failed" && item.error && (
                            <p className="mt-2 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                              <AlertCircle className="h-3 w-3" />
                              {item.error}
                            </p>
                          )}
                        </div>
                      </div>

                      {item.status === "done" && item.mockupUrl && (
                        <Button onClick={() => handleDownload(item)} variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={handleDownloadAll} className="flex-1" size="lg" disabled={completedCount === 0}>
                  <Download className="mr-2 h-4 w-4" />
                  Download All
                </Button>
                <Button onClick={() => setStep("configure")} variant="outline" size="lg">
                  Adjust & Reprocess
                </Button>
                <Button onClick={handleReset} variant="outline" size="lg">
                  New Batch
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
