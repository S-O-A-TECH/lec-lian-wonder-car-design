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
    set({
      selectedModel: model,
      partsConfig: { ...defaultPartsConfig },
      materialColors: {},
      selectedMaterial: null,
      history: [{ config: { ...defaultPartsConfig }, matColors: {} }],
      historyIndex: 0,
    });
  },

  // Currently selected material (clicked on 3D car)
  selectedMaterial: null,
  setSelectedMaterial: (matName) => set({ selectedMaterial: matName }),

  // Per-material color overrides { "Body": "#8c1a1a", "Carbon": "#1c1c1e" }
  materialColors: {},
  setMaterialColor: (matName, color) => {
    const state = get();
    const newMatColors = { ...state.materialColors, [matName]: color };
    const newEntry = { config: state.partsConfig, matColors: newMatColors };
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(newEntry);
    if (newHistory.length > MAX_HISTORY) newHistory.shift();
    set({
      materialColors: newMatColors,
      history: newHistory,
      historyIndex: Math.min(newHistory.length - 1, state.historyIndex + 1),
    });
  },

  // Parts configuration (finish, wheels, etc.)
  partsConfig: { ...defaultPartsConfig },
  setPart: (category, value) => {
    const state = get();
    const newConfig = { ...state.partsConfig, [category]: value };
    const newEntry = { config: newConfig, matColors: state.materialColors };
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(newEntry);
    if (newHistory.length > MAX_HISTORY) newHistory.shift();
    set({
      partsConfig: newConfig,
      history: newHistory,
      historyIndex: Math.min(newHistory.length - 1, state.historyIndex + 1),
    });
  },

  // Undo/Redo
  history: [{ config: { ...defaultPartsConfig }, matColors: {} }],
  historyIndex: 0,
  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex > 0) {
      const entry = history[historyIndex - 1];
      set({
        historyIndex: historyIndex - 1,
        partsConfig: { ...entry.config },
        materialColors: { ...entry.matColors },
      });
    }
  },
  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex < history.length - 1) {
      const entry = history[historyIndex + 1];
      set({
        historyIndex: historyIndex + 1,
        partsConfig: { ...entry.config },
        materialColors: { ...entry.matColors },
      });
    }
  },
  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,
}));

export default useStore;
