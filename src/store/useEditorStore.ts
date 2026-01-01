import { create } from 'zustand';
import type { EditorState, PageSize } from '@/types/editor';
import { DEFAULT_PAGE_SIZE } from '@/constants/editor';

interface EditorStore extends EditorState {
    setPageSize: (size: PageSize) => void;
    setZoom: (zoom: number) => void;
    setDirty: (isDirty: boolean) => void;
    setContent: (content: string, skipHistory?: boolean) => void;
    setFileName: (name: string | null) => void;
    setFolderHandle: (handle: FileSystemDirectoryHandle | null) => void;
    undo: () => void;
    redo: () => void;
    pushHistory: (content: string) => void;
    // 承認フロー用
    setLocked: (isLocked: boolean) => void;
    detectExternalUpdate: (newContent: string, snapshot: string | null) => void;
    approveUpdate: () => Promise<void>;
    discardUpdate: () => Promise<void>;
    reset: () => void;
}

const MAX_HISTORY = 50;

const initialState: EditorState = {
    pageSize: DEFAULT_PAGE_SIZE,
    zoom: 1.0,
    isDirty: false,
    content: '',
    fileName: null,
    folderHandle: null,
    history: {
        past: [],
        future: [],
    },
    isLocked: false,
    hasPendingChanges: false,
    pendingContent: '',
    pendingSnapshot: null,
};

export const useEditorStore = create<EditorStore>((set, get) => ({
    ...initialState,

    setPageSize: (pageSize) => set({ pageSize }),
    setZoom: (zoom) => set({ zoom }),
    setDirty: (isDirty) => set({ isDirty }),

    setContent: (content, skipHistory = false) => {
        const state = get();
        if (!skipHistory && state.content !== content) {
            state.pushHistory(state.content);
        }
        set({ content, isDirty: true });
    },

    setFileName: (fileName) => set({ fileName }),
    setFolderHandle: (folderHandle) => set({ folderHandle }),

    setLocked: (isLocked) => set({ isLocked }),

    detectExternalUpdate: (newContent, snapshot) => {
        set({
            hasPendingChanges: true,
            isLocked: true,
            pendingContent: newContent,
            pendingSnapshot: snapshot,
        });
    },

    approveUpdate: async () => {
        const { pendingContent, folderHandle, fileName } = get();
        // 履歴を積んでから更新
        get().setContent(pendingContent);

        // 要件：承認した場合は、上書き保存後、ロック解除。
        // AIがすでに上書きしているはずだが、エディタの状態を確定させるために保存
        if (folderHandle && fileName) {
            const { fileSystemService } = await import('@/services/fileSystem');
            await fileSystemService.saveFile(folderHandle, fileName, pendingContent);
        }

        set({
            hasPendingChanges: false,
            isLocked: false,
            pendingContent: '',
            pendingSnapshot: null,
            isDirty: false,
        });
    },

    discardUpdate: async () => {
        const { content, folderHandle, fileName } = get();

        // 要件：破棄した場合は、AIの変更を破棄し、元のデザインに戻して上書き保存。
        if (folderHandle && fileName) {
            const { fileSystemService } = await import('@/services/fileSystem');
            await fileSystemService.saveFile(folderHandle, fileName, content);
        }

        set({
            hasPendingChanges: false,
            isLocked: false,
            pendingContent: '',
            pendingSnapshot: null,
        });
    },

    pushHistory: (content) => {
        if (!content) return;
        set((state) => ({
            history: {
                past: [...state.history.past, content].slice(-MAX_HISTORY),
                future: [],
            }
        }));
    },

    undo: () => {
        const { history, content } = get();
        if (history.past.length === 0) return;

        const previous = history.past[history.past.length - 1];
        const newPast = history.past.slice(0, history.past.length - 1);

        set({
            content: previous,
            history: {
                past: newPast,
                future: [content, ...history.future].slice(0, MAX_HISTORY),
            },
            isDirty: true
        });
    },

    redo: () => {
        const { history, content } = get();
        if (history.future.length === 0) return;

        const next = history.future[0];
        const newFuture = history.future.slice(1);

        set({
            content: next,
            history: {
                past: [...history.past, content].slice(-MAX_HISTORY),
                future: newFuture,
            },
            isDirty: true
        });
    },

    reset: () => set(initialState),
}));
