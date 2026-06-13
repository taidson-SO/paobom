import { create } from "zustand";

type HealthUIState = {
  detailsVisible: boolean;
  toggleDetails: () => void;
};

export const useHealthUIStore = create<HealthUIState>((set) => ({
  detailsVisible: false,
  toggleDetails: () =>
    set((state) => ({
      detailsVisible: !state.detailsVisible,
    })),
}));
