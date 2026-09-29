"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

const MAX_FILES = 3;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"];

function formatSize(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FeedbackAttachments() {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");

  function updateFiles(nextFiles) {
    const transfer = new DataTransfer();
    nextFiles.forEach((file) => transfer.items.add(file));
    inputRef.current.files = transfer.files;
    setFiles(nextFiles);
  }

  function handleChange(event) {
    const selected = Array.from(event.target.files || []);
    const nextFiles = [...files];
    setError("");

    for (const file of selected) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Choose JPG, PNG, WebP, MP4 or WebM files.");
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        setError(`${file.name} is larger than the 5 MB limit.`);
        continue;
      }
      if (nextFiles.length >= MAX_FILES) {
        setError(`You can attach up to ${MAX_FILES} files.`);
        break;
      }
      nextFiles.push(file);
    }

    updateFiles(nextFiles);
  }

  return (
    <fieldset className="feedback-attachments">
      <legend>Add photos or videos <span className="form-field__meta">Optional · up to 3 files, 5 MB each</span></legend>
      <label className="feedback-attachments__picker">
        <ImagePlus size={19} aria-hidden="true" />
        <span>Choose photos or videos</span>
        <input
          ref={inputRef}
          type="file"
          name="attachments"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
          multiple
          onChange={handleChange}
          aria-describedby="feedback-attachments-help feedback-attachments-error"
        />
      </label>
      <p id="feedback-attachments-help" className="feedback-attachments__help">JPG, PNG, WebP, MP4 or WebM. Uploaded privately for the Bardapure team.</p>
      {files.length > 0 && (
        <ul className="feedback-attachments__list">
          {files.map((file, index) => (
            <li key={`${file.name}-${file.lastModified}-${index}`}>
              <span>{file.name} <small>{formatSize(file.size)}</small></span>
              <button type="button" onClick={() => updateFiles(files.filter((_, fileIndex) => fileIndex !== index))} aria-label={`Remove ${file.name}`}>
                <X size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p id="feedback-attachments-error" className="feedback-attachments__error" role="status">{error}</p>
    </fieldset>
  );
}
