import { create } from "zustand";
import type { IndustryKey } from "@config/industries";

type IndustryState = {
  selectedIndustry: IndustryKey;
  setSelectedIndustry: (industry: IndustryKey) => void;
};

const storageKey = "kindai-selected-industry";

function initialIndustry(): IndustryKey {
  if (typeof window === "undefined") return "cabinet-makers";
  const stored = window.localStorage.getItem(storageKey);
  return stored === "electricians" || stored === "cabinet-makers" ? stored : "cabinet-makers";
}

export const useIndustryStore = create<IndustryState>((set) => ({
  selectedIndustry: initialIndustry(),
  setSelectedIndustry: (industry) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, industry);
    }
    set({ selectedIndustry: industry });
  },
}));
