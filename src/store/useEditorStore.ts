import { create } from 'zustand';
import { EditorState, PageSize } from '@/types/editor';
import { DEFAULT_PAGE_SIZE } from '@/constants/editor';

interface EditorStore extends EditorState {
    setPageSize: (size: PageSize) => void;
    setZoom: (zoom: number) => void;
    setDirty: (isDirty: boolean) => void;
    setContent: (content: string) => void;
    setFileName: (name: string | null) => void;
    setFolderHandle: (handle: FileSystemDirectoryHandle | null) => void;
    reset: () => void;
}

const initialState: EditorState = {
    pageSize: DEFAULT_PAGE_SIZE,
    zoom: 1.0,
    isDirty: false,
    content: '',
    fileName: null,
    folderHandle: null,
};

export const useEditorStore = create<EditorStore>((set) => ({
    ...initialState,

    setPageSize: (pageSize) => set({ pageSize }),
    setZoom: (zoom) => set({ zoom }),
    setDirty: (isDirty) => set({ isDirty }),
    setContent: (content) => set({ content, isDirty: true }),
    setFileName: (fileName) => set({ fileName }),
    setFolderHandle: (folderHandle) => set({ folderHandle }),

    reset: () => set(initialState),
}));
