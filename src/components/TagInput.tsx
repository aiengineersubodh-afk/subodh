"use client";

import React, { useState } from "react";
import { Plus, X } from "lucide-react";

interface TagInputProps {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  required?: boolean;
}

export function TagInput({
  label,
  values,
  onChange,
  placeholder = "Type and press Enter or Add",
  suggestions = [],
  required = false,
}: TagInputProps) {
  const [inputVal, setInputVal] = useState("");

  const addTag = (raw: string) => {
    const cleaned = raw.trim();
    if (!cleaned) return;
    if (!values.includes(cleaned)) {
      onChange([...values, cleaned]);
    }
    setInputVal("");
  };

  const removeTag = (tag: string) => {
    onChange(values.filter((v) => v !== tag));
  };

  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
        {label} {required && <span className="text-[#2563EB]">*</span>}
      </label>

      <div className="flex gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(inputVal);
            }
          }}
          placeholder={placeholder}
          className="flex-1 px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#202124] focus:outline-none focus:border-[#2563EB]"
        />
        <button
          type="button"
          onClick={() => addTag(inputVal)}
          className="px-3.5 py-2.5 rounded-lg bg-[#F7F8FA] border border-[#E5E7EB] text-xs font-semibold text-[#202124] hover:border-[#2563EB] hover:text-[#2563EB] inline-flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>

      {/* Selected Tags */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {values.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EFF6FF] border border-[#2563EB]/30 text-xs font-medium text-[#202124]"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-[#666666] hover:text-[#2563EB]"
                aria-label={`Remove ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Quick Suggestions */}
      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-[#666666]">Quick add:</span>
          {suggestions
            .filter((s) => !values.includes(s))
            .slice(0, 6)
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addTag(s)}
                className="text-[11px] px-2 py-0.5 rounded bg-[#F7F8FA] border border-[#E5E7EB] text-[#666666] hover:border-[#2563EB] hover:text-[#202124] transition-colors"
              >
                + {s}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

