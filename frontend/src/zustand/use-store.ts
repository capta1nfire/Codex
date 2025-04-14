import { create } from 'zustand';
import { Language } from '../types/translations';

interface StoreState {
  currentLanguage: Language;
  color: string;
  backgroundColor: string;
  scale: number;
  logo: File | null;
  format: string;
  errorLevel: string;
  setCurrentLanguage: (language: Language) => void;
  setColor: (color: string) => void;
  setBackgroundColor: (backgroundColor: string) => void;
  setScale: (scale: number) => void;
  setLogo: (logo: File | null) => void;
  setFormat: (format: string) => void;
  setErrorLevel: (errorLevel: string) => void;
  svgString: string;
  setSvgString: (svgString: string) => void;
  scanCount: number;
  incrementScanCount: () => void;
  lastGeneratedSvg: { data: any; options: any } | null;
  setLastGeneratedSvg: (data: any, options: any) => void;
}

export const useStore = create<StoreState>((set) => ({
  currentLanguage: 'en',
  color: '#000000',
  backgroundColor: '#FFFFFF',
  scale: 1,
  logo: null,
  format: 'SVG',
  errorLevel: 'L',
  setCurrentLanguage: (language) => set({ currentLanguage: language }),
  setColor: (color) => set({ color }),
  setBackgroundColor: (backgroundColor) => set({ backgroundColor }),
  setScale: (scale) => set({ scale }),
  setLogo: (logo) => set({ logo }),
  setFormat: (format) => set({ format }),
  setErrorLevel: (errorLevel) => set({ errorLevel }),
  svgString: '',
  setSvgString: (svgString) => set({ svgString }),
  scanCount: 0,
  incrementScanCount: () => set((state) => ({ scanCount: state.scanCount + 1 })),
  lastGeneratedSvg: null,
  setLastGeneratedSvg: (data, options) =>
    set({ lastGeneratedSvg: { data, options } }),
}));