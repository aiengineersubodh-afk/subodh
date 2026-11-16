"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, Check, AlertCircle } from "lucide-react";

export interface CountryInfo {
  code: string; // 2-letter ISO code
  name: string;
  dialCode: string; // e.g. "+91"
  flag: string; // Emoji
  placeholder: string; // Local sample format
  minLen: number; // Minimum national digit length
  maxLen: number; // Maximum national digit length
  leadingDigitsPattern?: RegExp; // Optional start pattern
}

export const COUNTRIES: CountryInfo[] = [
  { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳", placeholder: "98765 43210", minLen: 10, maxLen: 10, leadingDigitsPattern: /^[6-9]/ },
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸", placeholder: "(555) 000-0000", minLen: 10, maxLen: 10 },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧", placeholder: "7911 123456", minLen: 9, maxLen: 10 },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦", placeholder: "(555) 000-0000", minLen: 10, maxLen: 10 },
  { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺", placeholder: "412 345 678", minLen: 9, maxLen: 9 },
  { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪", placeholder: "151 23456789", minLen: 10, maxLen: 11 },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪", placeholder: "50 123 4567", minLen: 9, maxLen: 9 },
  { code: "SG", name: "Singapore", dialCode: "+65", flag: "🇸🇬", placeholder: "8123 4567", minLen: 8, maxLen: 8 },
  { code: "CH", name: "Switzerland", dialCode: "+41", flag: "🇨🇭", placeholder: "79 123 45 67", minLen: 9, maxLen: 9 },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷", placeholder: "6 12 34 56 78", minLen: 9, maxLen: 9 },
  { code: "JP", name: "Japan", dialCode: "+81", flag: "🇯🇵", placeholder: "90 1234 5678", minLen: 10, maxLen: 10 },
  { code: "NL", name: "Netherlands", dialCode: "+31", flag: "🇳🇱", placeholder: "6 12345678", minLen: 9, maxLen: 9 },
  { code: "SE", name: "Sweden", dialCode: "+46", flag: "🇸🇪", placeholder: "70 123 45 67", minLen: 9, maxLen: 9 },
  { code: "NZ", name: "New Zealand", dialCode: "+64", flag: "🇳🇿", placeholder: "21 123 4567", minLen: 8, maxLen: 10 },
  { code: "IE", name: "Ireland", dialCode: "+353", flag: "🇮🇪", placeholder: "85 123 4567", minLen: 9, maxLen: 9 },
  { code: "IT", name: "Italy", dialCode: "+39", flag: "🇮🇹", placeholder: "312 345 6789", minLen: 9, maxLen: 10 },
  { code: "ES", name: "Spain", dialCode: "+34", flag: "🇪🇸", placeholder: "612 34 56 78", minLen: 9, maxLen: 9 },
  { code: "BR", name: "Brazil", dialCode: "+55", flag: "🇧🇷", placeholder: "11 91234-5678", minLen: 10, maxLen: 11 },
  { code: "ZA", name: "South Africa", dialCode: "+27", flag: "🇿🇦", placeholder: "71 123 4567", minLen: 9, maxLen: 9 },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦", placeholder: "50 123 4567", minLen: 9, maxLen: 9 },
  { code: "MY", name: "Malaysia", dialCode: "+60", flag: "🇲🇾", placeholder: "12-345 6789", minLen: 9, maxLen: 10 },
  { code: "ID", name: "Indonesia", dialCode: "+62", flag: "🇮🇩", placeholder: "812-3456-7890", minLen: 9, maxLen: 12 },
  { code: "KR", name: "South Korea", dialCode: "+82", flag: "🇰🇷", placeholder: "10-1234-5678", minLen: 9, maxLen: 10 },
  { code: "CN", name: "China", dialCode: "+86", flag: "🇨🇳", placeholder: "138 0000 0000", minLen: 11, maxLen: 11 },
  { code: "HK", name: "Hong Kong", dialCode: "+852", flag: "🇭🇰", placeholder: "9123 4567", minLen: 8, maxLen: 8 },
  { code: "QA", name: "Qatar", dialCode: "+974", flag: "🇶🇦", placeholder: "3312 3456", minLen: 8, maxLen: 8 },
  { code: "KW", name: "Kuwait", dialCode: "+965", flag: "🇰🇼", placeholder: "9123 4567", minLen: 8, maxLen: 8 },
  { code: "OM", name: "Oman", dialCode: "+968", flag: "🇴🇲", placeholder: "9123 4567", minLen: 8, maxLen: 8 },
  { code: "BH", name: "Bahrain", dialCode: "+973", flag: "🇧🇭", placeholder: "3912 3456", minLen: 8, maxLen: 8 },
  { code: "BD", name: "Bangladesh", dialCode: "+880", flag: "🇧🇩", placeholder: "1712-345678", minLen: 10, maxLen: 10 },
  { code: "LK", name: "Sri Lanka", dialCode: "+94", flag: "🇱🇰", placeholder: "71 234 5678", minLen: 9, maxLen: 9 },
  { code: "NP", name: "Nepal", dialCode: "+977", flag: "🇳🇵", placeholder: "984-1234567", minLen: 10, maxLen: 10 },
  { code: "PK", name: "Pakistan", dialCode: "+92", flag: "🇵🇰", placeholder: "300 1234567", minLen: 10, maxLen: 10 },
  { code: "NG", name: "Nigeria", dialCode: "+234", flag: "🇳🇬", placeholder: "802 123 4567", minLen: 10, maxLen: 10 },
  { code: "KE", name: "Kenya", dialCode: "+254", flag: "🇰🇪", placeholder: "712 345678", minLen: 9, maxLen: 9 },
  { code: "EG", name: "Egypt", dialCode: "+20", flag: "🇪🇬", placeholder: "10 1234 5678", minLen: 10, maxLen: 10 },
  { code: "PH", name: "Philippines", dialCode: "+63", flag: "🇵🇭", placeholder: "917 123 4567", minLen: 10, maxLen: 10 },
  { code: "TH", name: "Thailand", dialCode: "+66", flag: "🇹🇭", placeholder: "81 234 5678", minLen: 9, maxLen: 9 },
  { code: "VN", name: "Vietnam", dialCode: "+84", flag: "🇻🇳", placeholder: "91 234 56 78", minLen: 9, maxLen: 10 },
  { code: "TR", name: "Turkey", dialCode: "+90", flag: "🇹🇷", placeholder: "532 123 45 67", minLen: 10, maxLen: 10 },
  { code: "PL", name: "Poland", dialCode: "+48", flag: "🇵🇱", placeholder: "512 345 678", minLen: 9, maxLen: 9 },
  { code: "BE", name: "Belgium", dialCode: "+32", flag: "🇧🇪", placeholder: "470 12 34 56", minLen: 9, maxLen: 9 },
  { code: "AT", name: "Austria", dialCode: "+43", flag: "🇦🇹", placeholder: "664 1234567", minLen: 10, maxLen: 11 },
  { code: "DK", name: "Denmark", dialCode: "+45", flag: "🇩🇰", placeholder: "20 12 34 56", minLen: 8, maxLen: 8 },
  { code: "NO", name: "Norway", dialCode: "+47", flag: "🇳🇴", placeholder: "412 34 567", minLen: 8, maxLen: 8 },
  { code: "FI", name: "Finland", dialCode: "+358", flag: "🇫🇮", placeholder: "40 1234567", minLen: 7, maxLen: 10 },
  { code: "PT", name: "Portugal", dialCode: "+351", flag: "🇵🇹", placeholder: "912 345 678", minLen: 9, maxLen: 9 },
  { code: "GR", name: "Greece", dialCode: "+30", flag: "🇬🇷", placeholder: "691 234 5678", minLen: 10, maxLen: 10 },
  { code: "IL", name: "Israel", dialCode: "+972", flag: "🇮🇱", placeholder: "50-123-4567", minLen: 9, maxLen: 9 },
  { code: "MX", name: "Mexico", dialCode: "+52", flag: "🇲🇽", placeholder: "55 1234 5678", minLen: 10, maxLen: 10 },
  { code: "AR", name: "Argentina", dialCode: "+54", flag: "🇦🇷", placeholder: "11 1234-5678", minLen: 10, maxLen: 10 },
  { code: "CL", name: "Chile", dialCode: "+56", flag: "🇨🇱", placeholder: "9 1234 5678", minLen: 9, maxLen: 9 },
  { code: "CO", name: "Colombia", dialCode: "+57", flag: "🇨🇴", placeholder: "300 123 4567", minLen: 10, maxLen: 10 },
];

/**
 * Decompose an incoming phone string (e.g. "+91 97400 12345", "+1 (555) 000-0000", "9876543210")
 * into its matching country object and local national digits.
 */
export function parsePhoneNumber(
  rawPhone: string,
  preferredCountryNameOrCode?: string
): { country: CountryInfo; nationalNumber: string } {
  const trimmed = (rawPhone || "").trim();

  // Try matching preferred country first
  let defaultCountry = COUNTRIES.find((c) => c.code === "IN")!;
  if (preferredCountryNameOrCode) {
    const matched = COUNTRIES.find(
      (c) =>
        c.code.toLowerCase() === preferredCountryNameOrCode.toLowerCase() ||
        c.name.toLowerCase() === preferredCountryNameOrCode.toLowerCase()
    );
    if (matched) defaultCountry = matched;
  }

  if (!trimmed) {
    return { country: defaultCountry, nationalNumber: "" };
  }

  // If starts with +, match dial code by longest prefix match
  if (trimmed.startsWith("+")) {
    const sortedByDialLen = [...COUNTRIES].sort(
      (a, b) => b.dialCode.length - a.dialCode.length
    );
    for (const c of sortedByDialLen) {
      if (trimmed.startsWith(c.dialCode)) {
        // If preferred country has the same dial code (e.g. Canada +1 vs US +1), prefer it
        if (
          preferredCountryNameOrCode &&
          defaultCountry.dialCode === c.dialCode
        ) {
          const remainder = trimmed.slice(defaultCountry.dialCode.length).trim();
          return { country: defaultCountry, nationalNumber: remainder };
        }

        const remainder = trimmed.slice(c.dialCode.length).trim();
        return { country: c, nationalNumber: remainder };
      }
    }
  }

  // If no leading +, treat whole string as national number under default country
  return { country: defaultCountry, nationalNumber: trimmed };
}

/**
 * Validate phone number based on country constraints.
 */
export function validateInternationalPhone(
  phone: string,
  countryCode?: string
): { isValid: boolean; error?: string } {
  if (!phone || !phone.trim()) {
    return { isValid: false, error: "Phone number is required." };
  }

  const { country, nationalNumber } = parsePhoneNumber(phone, countryCode);
  const digitsOnly = nationalNumber.replace(/\D/g, "");

  if (!digitsOnly) {
    return { isValid: false, error: "Please enter your mobile number." };
  }

  if (digitsOnly.length < country.minLen) {
    return {
      isValid: false,
      error: `${country.name} phone number must be at least ${country.minLen} digits.`,
    };
  }

  if (digitsOnly.length > country.maxLen) {
    return {
      isValid: false,
      error: `${country.name} phone number must not exceed ${country.maxLen} digits.`,
    };
  }

  if (country.code === "IN" && country.leadingDigitsPattern) {
    if (!country.leadingDigitsPattern.test(digitsOnly)) {
      return {
        isValid: false,
        error: "Indian mobile numbers must start with 6, 7, 8, or 9.",
      };
    }
  }

  return { isValid: true };
}

interface InternationalPhoneInputProps {
  value: string;
  onChange: (fullFormattedNumber: string) => void;
  countryPreference?: string;
  label?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  theme?: "orange" | "blue" | "neutral";
}

export function InternationalPhoneInput({
  value,
  onChange,
  countryPreference = "India",
  label,
  required = false,
  error,
  placeholder,
  disabled = false,
  className = "",
  id,
  theme = "blue",
}: InternationalPhoneInputProps) {
  const autoId = useId();
  const inputId = id || autoId;
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Parse incoming value or initialize
  const parsed = useMemo(
    () => parsePhoneNumber(value, countryPreference),
    [value, countryPreference]
  );

  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(
    parsed.country
  );
  const [nationalNumber, setNationalNumber] = useState<string>(
    parsed.nationalNumber
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync internal state when external value changes meaningfully
  useEffect(() => {
    const currentFormatted = `${selectedCountry.dialCode} ${nationalNumber}`.trim();
    if (value && value.trim() !== currentFormatted && value.trim() !== currentFormatted.replace(/\s+/g, "")) {
      const p = parsePhoneNumber(value, countryPreference);
      setSelectedCountry(p.country);
      setNationalNumber(p.nationalNumber);
    } else if (!value && nationalNumber) {
      setNationalNumber("");
    }
  }, [value, countryPreference]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Focus search input when opened
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Filter countries by name or dial code
  const filteredCountries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleCountrySelect = (c: CountryInfo) => {
    setSelectedCountry(c);
    setIsDropdownOpen(false);
    setSearchQuery("");

    // Emit updated combined value
    const trimmed = nationalNumber.trim();
    if (trimmed) {
      onChange(`${c.dialCode} ${trimmed}`);
    } else {
      onChange("");
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputStr = e.target.value;

    // If starts with "+", check if it matches a known country dial code
    if (inputStr.startsWith("+")) {
      const matchingCountry = [...COUNTRIES]
        .sort((a, b) => b.dialCode.length - a.dialCode.length)
        .find((c) => inputStr.startsWith(c.dialCode));

      if (matchingCountry) {
        setSelectedCountry(matchingCountry);
        inputStr = inputStr.slice(matchingCountry.dialCode.length).trim();
      } else if (inputStr === "+") {
        inputStr = "";
      }
    }

    // Keep digits, spaces, and hyphens
    const cleaned = inputStr.replace(/[^\d\s-]/g, "");
    setNationalNumber(cleaned);

    const digitsOnly = cleaned.replace(/\D/g, "");
    if (digitsOnly) {
      onChange(`${selectedCountry.dialCode} ${cleaned.trim()}`);
    } else {
      onChange("");
    }
  };

  const focusRing =
    theme === "orange"
      ? "focus-within:border-[#F97316] focus-within:ring-1 focus-within:ring-[#F97316]"
      : "focus-within:border-[#2563EB] focus-within:ring-1 focus-within:ring-[#2563EB]";

  const borderClass = error
    ? "border-red-500 bg-red-50/20"
    : "border-[#E5E7EB] bg-white";

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5"
        >
          {label} {required && <span className={theme === "orange" ? "text-[#F97316]" : "text-[#2563EB]"}>*</span>}
        </label>
      )}

      <div
        className={`relative flex items-center rounded-lg border transition-all ${borderClass} ${focusRing} ${
          disabled ? "opacity-60 pointer-events-none bg-gray-50" : ""
        }`}
      >
        {/* Country Selector Toggle Button */}
        <button
          type="button"
          onClick={() => {
            if (!disabled) {
              setIsDropdownOpen((prev) => !prev);
              setSearchQuery("");
            }
          }}
          aria-haspopup="listbox"
          aria-expanded={isDropdownOpen}
          className="flex items-center gap-1.5 px-3 py-2.5 border-r border-[#E5E7EB] bg-[#F7F8FA] hover:bg-[#EFF0F2] text-[#202124] rounded-l-lg transition-colors shrink-0 select-none text-xs font-medium cursor-pointer"
        >
          <span className="text-base leading-none" role="img" aria-label={selectedCountry.name}>
            {selectedCountry.flag}
          </span>
          <span className="font-semibold text-xs text-[#202124]">
            {selectedCountry.dialCode}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-[#666666] shrink-0" />
        </button>

        {/* National Mobile Number Input */}
        <input
          id={inputId}
          type="tel"
          inputMode="numeric"
          disabled={disabled}
          value={nationalNumber}
          onChange={handleNumberChange}
          placeholder={placeholder || selectedCountry.placeholder}
          className="flex-1 min-w-0 px-3.5 py-2.5 text-sm text-[#202124] placeholder:text-[#9CA3AF] bg-transparent focus:outline-none"
        />

        {/* Floating Searchable Country Dropdown */}
        {isDropdownOpen && (
          <div className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 max-h-72 bg-white rounded-xl border border-[#E5E7EB] shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-100">
            {/* Search Bar */}
            <div className="p-2.5 border-b border-[#E5E7EB] bg-[#F7F8FA]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search country or code (e.g. +44, USA)..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E5E7EB] bg-white text-[#202124] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            {/* Country List */}
            <div className="overflow-y-auto max-h-56 divide-y divide-gray-50">
              {filteredCountries.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#666666]">
                  No matching countries found.
                </div>
              ) : (
                filteredCountries.map((c) => {
                  const isSelected = c.code === selectedCountry.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleCountrySelect(c)}
                      className={`w-full px-3.5 py-2 flex items-center justify-between text-left text-xs hover:bg-[#F0F7FF] transition-colors cursor-pointer ${
                        isSelected ? "bg-[#EFF6FF] font-semibold text-[#2563EB]" : "text-[#202124]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base shrink-0 leading-none" role="img" aria-label={c.name}>
                          {c.flag}
                        </span>
                        <span className="truncate">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-gray-500 font-mono text-[11px]">
                          {c.dialCode}
                        </span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#2563EB]" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
