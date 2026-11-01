/**
 * Files a visitor can attach to a request (photos, PDFs, drawings).
 *
 * ONE MODULE SO BOTH SIDES AGREE: the attachment tile says what it accepts
 * before an upload starts, and /api/consultation/files enforces the same rules
 * after, because a browser check is a courtesy and not a control.
 *
 * Each file is its own upload request after the lead is saved. The platform
 * caps one request at 32 MB (see MAX_REQUEST_UPLOAD_BYTES in
 * shared/re10/uploads.ts), so 20 MB per file stays well inside it, and a slow
 * or failed upload can never cost the visitor their request.
 */

export const MAX_REQUEST_FILES = 10;
export const MAX_REQUEST_FILE_MB = 20;
export const MAX_REQUEST_FILE_BYTES = MAX_REQUEST_FILE_MB * 1024 * 1024;

/** The picker filter: on a phone this offers the camera, the photo library and files. */
export const REQUEST_FILE_ACCEPT = "image/*,application/pdf,.heic,.heif";

/** The one hint line under the tile, from the real limits. */
export const REQUEST_FILE_HINT = `Optional. Photos, PDFs or drawings. Up to ${MAX_REQUEST_FILES} files, ${MAX_REQUEST_FILE_MB} MB each.`;

const TYPE_TO_EXT = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/heic", "heic"],
  ["image/heif", "heif"],
  ["application/pdf", "pdf"],
]);

const EXT_TO_EXT = new Map<string, string>([
  ["jpg", "jpg"],
  ["jpeg", "jpg"],
  ["png", "png"],
  ["webp", "webp"],
  ["gif", "gif"],
  ["heic", "heic"],
  ["heif", "heif"],
  ["pdf", "pdf"],
]);

const EXT_TO_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  pdf: "application/pdf",
};

type FileLike = { name: string; type: string; size: number };

/**
 * Stored extension for an accepted file, or null when it is not one we take.
 * Phones often send HEIC with an empty or generic type, so the name decides then.
 */
export function requestFileExtension(file: { name: string; type: string }): string | null {
  const fromType = TYPE_TO_EXT.get(file.type);
  if (fromType) return fromType;
  if (file.type && file.type !== "application/octet-stream") return null;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_EXT.get(ext) ?? null;
}

export function requestFileMimeType(file: { type: string }, ext: string): string {
  if (TYPE_TO_EXT.has(file.type)) return file.type;
  return EXT_TO_TYPE[ext] ?? "application/octet-stream";
}

export function requestFileKind(file: { name: string; type: string }): "image" | "pdf" | null {
  const ext = requestFileExtension(file);
  if (!ext) return null;
  return ext === "pdf" ? "pdf" : "image";
}

/** Storage-safe name: letters, digits, dash and underscore, then the extension. */
export function requestFileSafeName(name: string, ext: string): string {
  const base = name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${base || "file"}.${ext}`;
}

/** Plain-words reason one file cannot be added, or null when it can. */
export function requestFileProblem(file: FileLike): string | null {
  if (!requestFileExtension(file)) return `${file.name} is not a photo or PDF, so it was not added.`;
  if (file.size <= 0) return `${file.name} is empty, so it was not added.`;
  if (file.size > MAX_REQUEST_FILE_BYTES) {
    return `${file.name} is larger than ${MAX_REQUEST_FILE_MB} MB, so it was not added.`;
  }
  return null;
}

/**
 * Splits a picked or dropped set into the files that can be added and the
 * plain messages for those that cannot. Never throws, never blocks the form.
 */
export function partitionRequestFiles<T extends FileLike>(
  incoming: T[],
  existing: FileLike[],
): { accepted: T[]; problems: string[] } {
  const accepted: T[] = [];
  const problems: string[] = [];
  let count = existing.length;
  for (const file of incoming) {
    if ([...existing, ...accepted].some((f) => f.name === file.name && f.size === file.size)) continue;
    const problem = requestFileProblem(file);
    if (problem) {
      problems.push(problem);
      continue;
    }
    if (count >= MAX_REQUEST_FILES) {
      problems.push(`You can add up to ${MAX_REQUEST_FILES} files. ${file.name} was not added.`);
      continue;
    }
    accepted.push(file);
    count += 1;
  }
  return { accepted, problems };
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
