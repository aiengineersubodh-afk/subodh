"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";

interface FileUploadFieldProps {
  label: string;
  category: "avatar" | "document";
  value: string;
  onChange: (url: string) => void;
  helperText?: string;
}

export function FileUploadField({
  label,
  category,
  value,
  onChange,
  helperText,
}: FileUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    // Client-side validation before upload
    if (category === "avatar") {
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setError("Invalid image format. Please upload a JPG, PNG, or WebP photograph.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Profile photograph must be smaller than 5 MB.");
        return;
      }
    } else {
      if (file.type !== "application/pdf") {
        setError("Invalid document format. Only PDF files (.pdf) are allowed for Resumes/CVs.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("Resume/CV PDF must be smaller than 10 MB.");
        return;
      }
    }

    setUploading(true);
    setProgress(35);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);

      setProgress(70);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed.");
        setProgress(0);
      } else {
        setProgress(100);
        onChange(data.url);
        setFileName(data.fileName || file.name);
      }
    } catch {
      setError("Failed to upload file. Please try again.");
      setProgress(0);
    } finally {
      setTimeout(() => {
        setUploading(false);
      }, 250);
    }
  };

  const handleRemove = () => {
    onChange("");
    setFileName("");
    setProgress(0);
    setError("");
  };

  const displayFileName =
    fileName || (value ? decodeURIComponent(value.split("/").pop() || value) : "");

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124]">
        {label}
      </label>

      <div className="p-4 rounded-xl border border-dashed border-[#D1D5DB] bg-[#F7F8FA] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            {category === "avatar" && value ? (
              <img
                src={value}
                alt="Profile Photograph Preview"
                className="w-16 h-16 rounded-xl object-cover border border-[#E5E7EB] bg-white shrink-0 shadow-xs"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center shrink-0">
                {category === "avatar" ? (
                  <ImageIcon className="w-5 h-5 text-[#2563EB]" />
                ) : (
                  <FileText className="w-5 h-5 text-[#2563EB]" />
                )}
              </div>
            )}

            <div className="min-w-0 flex-1 space-y-1">
              {value ? (
                <>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      {category === "avatar"
                        ? "Photograph uploaded & active"
                        : "Resume / CV uploaded (PDF)"}
                    </span>
                  </div>
                  <p className="text-xs text-[#202124] font-medium truncate">
                    File: {displayFileName}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold text-[#202124]">
                    {category === "avatar"
                      ? "No profile photograph uploaded yet"
                      : "No Resume / CV PDF uploaded yet"}
                  </p>
                  <p className="text-xs text-[#666666]">
                    {helperText ||
                      (category === "avatar"
                        ? "Supported formats: JPG, PNG, WebP (Max size: 5 MB)"
                        : "Supported format: PDF only (Max size: 10 MB)")}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-[#E5E7EB] text-xs font-semibold text-[#202124] hover:border-[#2563EB] hover:text-[#2563EB] cursor-pointer transition-colors">
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2563EB]" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>
                    {value
                      ? category === "avatar"
                        ? "Change Image"
                        : "Replace PDF"
                      : category === "avatar"
                      ? "Upload Image"
                      : "Upload PDF"}
                  </span>
                </>
              )}
              <input
                type="file"
                accept={
                  category === "avatar"
                    ? "image/jpeg,image/png,image/webp"
                    : "application/pdf"
                }
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>

            {value && !uploading && (
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                title="Remove file"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>

        {/* Upload Progress Bar */}
        {(uploading || (progress === 100 && value)) && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[#666666]">
              <span>{uploading ? "Uploading file..." : "Upload complete"}</span>
              <span className="font-semibold text-[#202124]">{progress || 100}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2563EB] transition-all duration-300"
                style={{ width: `${progress || 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
