import { create } from 'zustand';
import { defaultPartsConfig } from './data/carCatalog';

const MAX_HISTORY = 50;

const useStore = create((set, get) => ({
  // Nickname
  nickname: localStorage.getItem('wondercar-nickname') || '',
  setNickname: (name) => {
    localStorage.setItem('wondercar-nickname', name);
    set({ nickname: name });
  },

  // Selected brand and model
  selectedBrand: null,
  selectedModel: null,
  selectBrand: (brand) => set({ selectedBrand: brand, selectedModel: null }),
  selectModel: (model) => {
    const newConfig = { ...defaultPartsConfig };
    set({
      selectedModel: model,
      partsConfig: newConfig,
      history: [newConfig],
      historyIndex: 0,
    });
  },

  // Parts configuration
  partsConfig: { ...defaultPartsConfig },
  setPart: (category, value) => {
    const state = get();
    const newConfig = { ...state.partsConfig, [category]: value };
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(newConfig);
    if (newHistory.length > MAX_HISTORY) newHistory.shift();
    set({
      partsConfig: newConfig,
      history: newHistory,
      historyIndex: Math.min(newHistory.length - 1, state.historyIndex + 1),
    });
  },

  // Undo/Redo
  history: [{ ...defaultPartsConfig }],
  historyIndex: 0,
  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex > 0) {
      set({
        historyIndex: historyIndex - 1,
        partsConfig: { ...history[historyIndex - 1] },
      });
    }
  },
  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex < history.length - 1) {
      set({
        historyIndex: historyIndex + 1,
        partsConfig: { ...history[historyIndex + 1] },
      });
    }
  },
  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,
}));

export default useStore;
