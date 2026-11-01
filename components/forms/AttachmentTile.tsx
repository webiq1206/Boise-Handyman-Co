"use client";

import { useEffect, useState } from "react";
import { FileText, Paperclip, X } from "lucide-react";
import { REQUEST_FILE_ACCEPT, REQUEST_FILE_HINT, formatFileSize, requestFileKind } from "@/shared/requestFiles";

/**
 * "Add photos, plans or files": one friendly tile instead of the browser's raw
 * "Choose files" control. Tapping it opens the native picker (on a phone that
 * offers the camera, the photo library and files); on a desktop files can be
 * dropped on it. Picked files show as chips with a preview or a PDF icon,
 * their size and a 44px remove button. Files that cannot be added get one
 * plain line and are left out; nothing here ever blocks the form.
 *
 * The native input stays in the page (visually hidden, still focusable and
 * labelled), so keyboards and screen readers reach it as itself.
 */

export type AttachmentStatus = "ready" | "uploading" | "done" | "failed";

export interface PickedFile {
  id: string;
  file: File;
  status?: AttachmentStatus;
}

interface AttachmentTileProps {
  id: string;
  files: PickedFile[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  /** One plain line about files that were not added. */
  message?: string;
  label?: string;
  testId?: string;
}

function Preview({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);
  const kind = requestFileKind(file);
  const renderable = kind === "image" && /^image\/(jpeg|png|webp|gif)$/.test(file.type);
  useEffect(() => {
    if (!renderable) return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, renderable]);
  // eslint-disable-next-line @next/next/no-img-element -- a local object URL preview, nothing to optimize
  if (url) return <img className="hm-tile-thumb" src={url} alt="" width={44} height={44} />;
  return (
    <span className="hm-tile-thumb hm-tile-thumb-icon" aria-hidden="true">
      {kind === "pdf" ? <FileText size={20} /> : <Paperclip size={20} />}
    </span>
  );
}

const STATUS_TEXT: Record<AttachmentStatus, string> = {
  ready: "",
  uploading: "Uploading",
  done: "Added",
  failed: "Did not upload",
};

export function AttachmentTile({
  id,
  files,
  onAdd,
  onRemove,
  message,
  label = "Add photos, plans or files",
  testId = "attachment-tile",
}: AttachmentTileProps) {
  const [dragging, setDragging] = useState(false);
  const hintId = `${id}-hint`;
  const messageId = `${id}-message`;

  return (
    <div className="hm-tile-field" data-testid={testId}>
      <div
        className={`hm-tile${dragging ? " is-dragging" : ""}`}
        onDragOver={(event) => {
          if (!event.dataTransfer.types.includes("Files")) return;
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const dropped = Array.from(event.dataTransfer.files ?? []);
          if (dropped.length) onAdd(dropped);
        }}
      >
        <input
          id={id}
          className="hm-tile-input"
          type="file"
          accept={REQUEST_FILE_ACCEPT}
          multiple
          data-testid="input-files"
          aria-describedby={`${hintId}${message ? ` ${messageId}` : ""}`}
          onChange={(event) => {
            const picked = Array.from(event.target.files ?? []);
            event.target.value = "";
            if (picked.length) onAdd(picked);
          }}
        />
        <label htmlFor={id} className="hm-tile-face">
          <Paperclip className="hm-tile-icon" size={22} aria-hidden="true" />
          <span className="hm-tile-text">
            <span className="hm-tile-label">{label}</span>
            <span className="hm-tile-hint" id={hintId}>
              {REQUEST_FILE_HINT}
            </span>
          </span>
        </label>
      </div>
      <p className="hm-form-error-text" id={messageId} aria-live="polite" data-testid="attachment-message">
        {message ?? ""}
      </p>
      {files.length > 0 && (
        <ul className="hm-tile-chips" aria-label="Files added">
          {files.map(({ id: fileId, file, status = "ready" }) => (
            <li key={fileId} className={`hm-tile-chip is-${status}`} data-testid="attachment-chip">
              <Preview file={file} />
              <span className="hm-tile-chip-text">
                <span className="hm-tile-chip-name">{file.name}</span>
                <span className="hm-tile-chip-meta">
                  {formatFileSize(file.size)}
                  {STATUS_TEXT[status] ? ` · ${STATUS_TEXT[status]}` : ""}
                </span>
              </span>
              {(status === "ready" || status === "failed") && (
                <button
                  type="button"
                  className="hm-tile-remove"
                  onClick={() => onRemove(fileId)}
                  data-testid="button-remove-file"
                >
                  <X size={18} aria-hidden="true" />
                  <span className="sr-only">Remove {file.name}</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
