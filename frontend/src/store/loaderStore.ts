import { create } from 'zustand';

interface LoaderState {
    isLoading: boolean;
    showSkeleton: boolean;
    showLoader: () => void;
    hideLoader: () => void;
    setShowSkeleton: (show: boolean) => void;
    loadingCounter: number;
}

export const useLoaderStore = create<LoaderState>((set) => ({
    isLoading: false,
    showSkeleton: false,
    loadingCounter: 0,
    showLoader: () => set((state) => {
        const newCounter = state.loadingCounter + 1;
        return {
            loadingCounter: newCounter,
            isLoading: true
        };
    }),
    hideLoader: () => set((state) => {
        const newCounter = Math.max(0, state.loadingCounter - 1);
        return {
            loadingCounter: newCounter,
            isLoading: newCounter > 0
        };
    }),
    setShowSkeleton: (show: boolean) => set({ showSkeleton: show }),
}));

export const showLoader = () => useLoaderStore.getState().showLoader();
export const hideLoader = () => useLoaderStore.getState().hideLoader();
export const setShowSkeleton = (show: boolean) => useLoaderStore.getState().setShowSkeleton(show);
