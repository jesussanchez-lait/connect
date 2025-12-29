"use client";

import { Gender } from "@/src/domain/entities/User";

interface GenderOption {
  value: Gender | "";
  label: string;
  icon: string;
}

interface GenderSelectorProps {
  value: Gender | "";
  onChange: (value: Gender | "") => void;
  id?: string;
}

const genderOptions: GenderOption[] = [
  {
    value: "MALE",
    label: "Masculino",
    icon: "♂",
  },
  {
    value: "FEMALE",
    label: "Femenino",
    icon: "♀",
  },
  {
    value: "OTHER",
    label: "Otro",
    icon: "⚧",
  },
  {
    value: "PREFER_NOT_TO_SAY",
    label: "Prefiero no decir",
    icon: "○",
  },
];

export function GenderSelector({
  value,
  onChange,
  id = "gender",
}: GenderSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {genderOptions.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(isSelected ? "" : option.value)}
            className={`
              flex flex-col items-center justify-center gap-1 p-2 rounded-lg border-2 transition-all
              ${
                isSelected
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
              }
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            `}
            aria-pressed={isSelected}
            aria-label={option.label}
          >
            <span className="text-xl">{option.icon}</span>
            <span className="text-xs font-medium">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

