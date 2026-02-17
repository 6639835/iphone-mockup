"use client";

import { useState, useCallback } from "react";
import { Upload, Download, Loader2, Smartphone } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { detectIPhoneModel, IPHONE_MODELS } from "@/lib/iphone-models";
import { cn } from "@/lib/utils";

interface DetectionResult {
  detected_model: string;
  all_matches: string[];
  colors: string[];
  resolution: [number, number];
  series: string;
}

type Step = "upload" | "select-color" | "preview";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const TARGET_UPLOAD_BYTES = Math.floor(MAX_UPLOAD_BYTES * 0.95);
const MAX_UPLOAD_LABEL = "4 MB";

function uploadTooLargeMessage(): string {
  return `Image is too large. Please use a file under ${MAX_UPLOAD_LABEL}.`;
}

function stripExtension(filename: string): string {
  const index = filename.lastIndexOf(".");
  return index > 0 ? filename.slice(0, index) : filename;
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
  };
}

export function MockupGenerator() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setError(null);

    // Detect iPhone model
    setIsDetecting(true);
    try {
      const optimizedFile = await optimizeUploadFile(selectedFile);
      const result = await detectFromImage(optimizedFile);
      const url = URL.createObjectURL(optimizedFile);

      setFile(optimizedFile);
      setPreviewUrl(url);
      setDetection(result);
      setStep("select-color");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to detect iPhone model");
      setPreviewUrl(null);
      setFile(null);
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && droppedFile.type.startsWith("image/")) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFileSelect(selectedFile);
      }
    },
    [handleFileSelect]
  );

  const handleColorSelect = async (color: string) => {
    if (!file || !detection) return;

    setSelectedColor(color);
    setIsGenerating(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("model", detection.detected_model);
      formData.append("color", color);
      formData.append("orientation", "Portrait");

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await parseErrorDetail(response, "Failed to generate mockup");
        throw new Error(error);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setMockupUrl(url);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate mockup");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (mockupUrl && detection && selectedColor) {
      const a = document.createElement("a");
      a.href = mockupUrl;
      a.download = `mockup-${detection.detected_model}-${selectedColor}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleReset = () => {
    setStep("upload");
    setFile(null);
    setPreviewUrl(null);
    setDetection(null);
    setSelectedColor(null);
    setMockupUrl(null);
    setError(null);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Create Mockup</CardTitle>
          <CardDescription>Upload your iPhone screenshot to get started</CardDescription>
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
                onChange={handleFileInput}
                className="absolute inset-0 cursor-pointer opacity-0"
              />

              {isDetecting ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-neutral-400" />
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Detecting iPhone model...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-center">
                  <Upload className="h-12 w-12 text-neutral-400" />
                  <div>
                    <p className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                      Drop your screenshot here
                    </p>
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                      or click to browse
                    </p>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-500">
                    Supports PNG, JPG, HEIC (iPhone 16 & 17 series)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Color Selection Step */}
          {step === "select-color" && detection && (
            <div className="space-y-6">
              <div className="flex items-start gap-4 rounded-lg bg-neutral-100 p-4 dark:bg-neutral-800">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Screenshot preview"
                    className="h-32 w-auto rounded object-contain"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {detection.detected_model}
                    </h3>
                  </div>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                    {detection.resolution[0]} × {detection.resolution[1]}
                  </p>
                  {detection.all_matches.length > 1 && (
                    <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-500">
                      Also matches:{" "}
                      {detection.all_matches
                        .filter((m) => m !== detection.detected_model)
                        .join(", ")}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Choose device color
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {detection.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorSelect(color)}
                      disabled={isGenerating}
                      className={cn(
                        "rounded-lg border-2 p-4 text-left transition-all hover:border-neutral-900 dark:hover:border-neutral-100",
                        selectedColor === color
                          ? "border-neutral-900 bg-neutral-100 dark:border-neutral-100 dark:bg-neutral-800"
                          : "border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
                      )}
                    >
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">{color}</p>
                    </button>
                  ))}
                </div>
              </div>

              {isGenerating && (
                <div className="flex items-center justify-center gap-2 py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-neutral-600" />
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Generating mockup...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Preview Step */}
          {step === "preview" && mockupUrl && (
            <div className="space-y-6">
              <div className="rounded-lg bg-neutral-100 p-8 dark:bg-neutral-800">
                <img
                  src={mockupUrl}
                  alt="Generated mockup"
                  className="mx-auto max-h-[500px] w-auto rounded-lg shadow-2xl"
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={handleDownload} className="flex-1" size="lg">
                  <Download className="mr-2 h-4 w-4" />
                  Download Mockup
                </Button>
                <Button onClick={handleReset} variant="outline" size="lg">
                  Create Another
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
