"use client";

import { useState } from "react";

// Phone camera photos routinely come in at 3-8MB+, well over the 4MB
// Server Action body limit (itself near Vercel's ~4.5MB hard cap on
// serverless function payloads). Resizing/recompressing client-side before
// submit keeps the upload well under that limit regardless of the source
// device, instead of silently failing with no feedback to the patient.
async function compressImage(file: File, maxDim = 1600, quality = 0.8): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}

export function PhotoInput({
  name,
  required,
  captureEnvironment,
}: {
  name: string;
  required?: boolean;
  captureEnvironment?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "compressing" | "error">("idle");

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const form = input.closest("form");
    const submitButton = form?.querySelector<HTMLButtonElement>("button");
    if (submitButton) submitButton.disabled = true;
    setStatus("compressing");

    try {
      const compressed = await compressImage(file);
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(compressed);
      input.files = dataTransfer.files;
      setStatus("idle");
    } catch (err) {
      console.error("compressImage failed, uploading original file:", err);
      setStatus("error");
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  }

  return (
    <div>
      <input
        name={name}
        type="file"
        accept="image/*"
        capture={captureEnvironment ? "environment" : undefined}
        required={required}
        onChange={handleChange}
        className="text-sm"
      />
      {status === "compressing" && <p className="mt-1 text-xs text-muted">Comprimo la foto…</p>}
      {status === "error" && <p className="mt-1 text-xs text-error">Non sono riuscito a ridurre la foto: se il salvataggio fallisce, riprova con una foto più piccola.</p>}
    </div>
  );
}
