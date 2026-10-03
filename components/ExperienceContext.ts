"use client";
import { createContext, useContext } from "react";
import type { SectionId } from "@/lib/content";

export type Phase = "menu" | "main";

export type ExperienceApi = {
  phase: Phase;
  go: (target: SectionId) => void;
  toMenu: () => void;
};

export const ExperienceContext = createContext<ExperienceApi | null>(null);

export const useExperience = () => {
  const ctx = useContext(ExperienceContext);
  if (!ctx) throw new Error("useExperience fora do provider");
  return ctx;
};
