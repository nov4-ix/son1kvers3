import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LiteraryKnobs {
  emotionalIntensity: number;
  poeticStyle: number;
  rhymeComplexity: number;
  narrativeDepth: number;
  languageStyle: number;
  themeIntensity: number;
}

interface GeneratorState {
  knobs: LiteraryKnobs;
  isCustomMode: boolean;
  setKnobs: (knobs: Partial<LiteraryKnobs>) => void;
  resetKnobs: () => void;
  toggleMode: () => void;
}

const defaultKnobs: LiteraryKnobs = {
  emotionalIntensity: 7,
  poeticStyle: 6,
  rhymeComplexity: 5,
  narrativeDepth: 6,
  languageStyle: 7,
  themeIntensity: 8
};

export const useGeneratorStore = create<GeneratorState>()(
  persist(
    (set) => ({
      knobs: defaultKnobs,
      isCustomMode: false,
      setKnobs: (newKnobs) => {
        set((state) => ({
          knobs: { ...state.knobs, ...newKnobs }
        }));
      },
      resetKnobs: () => {
        set({ knobs: defaultKnobs });
      },
      toggleMode: () => {
        set((state) => ({
          isCustomMode: !state.isCustomMode
        }));
      }
    }),
    {
      name: 'generator-storage',
      partialize: (state) => ({ knobs: state.knobs })
    }
  )
);

