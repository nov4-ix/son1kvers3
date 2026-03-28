/**
 * Global Audio Store - Minimalista
 * Evita que múltiples audios suenen simultáneamente
 * 
 * PRIORIDAD 1: Arregla el bug crítico de múltiples audios
 */

import { create } from 'zustand';

interface AudioState {
  currentAudio: HTMLAudioElement | null;
  currentTrackId: string | null;
  isPlaying: boolean;
  play: (trackId: string, src: string) => Promise<void>;
  pause: () => void;
  stop: () => void;
  cleanup: () => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  currentAudio: null,
  currentTrackId: null,
  isPlaying: false,

  play: async (trackId: string, src: string) => {
    const { currentAudio, currentTrackId } = get();

    // Si es la misma canción, solo resume/pause
    if (currentTrackId === trackId && currentAudio) {
      if (currentAudio.paused) {
        await currentAudio.play();
        set({ isPlaying: true });
      } else {
        currentAudio.pause();
        set({ isPlaying: false });
      }
      return;
    }

    // CRÍTICO: Detener audio anterior antes de crear uno nuevo
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    // Crear nuevo audio
    const audio = new Audio(src);
    
    // Error handling
    audio.onerror = () => {
      console.error('Error loading audio:', src);
      set({ isPlaying: false, currentAudio: null, currentTrackId: null });
    };

    // End of track
    audio.onended = () => {
      set({ isPlaying: false });
    };

    try {
      await audio.play();
      set({
        currentAudio: audio,
        currentTrackId: trackId,
        isPlaying: true
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      set({ isPlaying: false, currentAudio: null, currentTrackId: null });
    }
  },

  pause: () => {
    const { currentAudio } = get();
    if (currentAudio) {
      currentAudio.pause();
    }
    set({ isPlaying: false });
  },

  stop: () => {
    const { currentAudio } = get();
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    set({ isPlaying: false });
  },

  cleanup: () => {
    const { currentAudio } = get();
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
      currentAudio.load();
    }
    set({
      currentAudio: null,
      currentTrackId: null,
      isPlaying: false
    });
  }
}));

