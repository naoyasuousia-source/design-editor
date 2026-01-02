import { create } from 'zustand';
import type { EditorState, PageSize } from '@/types/editor';
import { PAGE_SIZES } from '@/types/editor';
import { DEFAULT_PAGE_SIZE } from '@/constants/editor';
import { parseMetaMessage, extractDesignContent, constructFullHTML } from '@/utils/htmlProcessing';

interface EditorStore extends EditorState {
    setPageSize: (size: PageSize) => void;
    setCustomSize: (width: number | null, height: number | null) => void;
    expandCanvas: (neededWidth: number, neededHeight: number) => void;
    setZoom: (zoom: number) => void;
    setDirty: (isDirty: boolean) => void;
    setContent: (content: string, skipHistory?: boolean) => void;
    setFileName: (name: string | null) => void;
    setFolderHandle: (handle: FileSystemDirectoryHandle | null) => void;
    // プロジェクトフォルダ管理システム用
    setProjectDirectoryHandle: (handle: FileSystemDirectoryHandle | null) => void;
    setCurrentFileHandle: (handle: FileSystemFileHandle | null) => void;
    setProjectFolderName: (name: string) => void;
    undo: () => void;
    redo: () => void;
    pushHistory: (content: string) => void;
    // 承認フロー用
    setLocked: (isLocked: boolean) => void;
    detectExternalUpdate: (newContent: string, snapshot: string | null) => void;
    approveUpdate: () => Promise<void>;
    discardUpdate: () => Promise<void>;
    setMetaMessage: (meta: Partial<import('@/types/editor').MetaMessage>) => void;
    setLastSaveTime: (time: number) => void;
    setImageSaveMode: (enabled: boolean) => void;
    setCropAspectRatio: (ratio: number | 'free' | null) => void;
    setResponsiveResize: (enabled: boolean) => void;
    reset: () => void;
}

const MAX_HISTORY = 50;

const initialState: EditorState & {
    lastSaveTime: number;
    // 画像保存ウィザード用
    isImageSaveMode: boolean;
    cropAspectRatio: number | 'free' | null;
} = {
    pageSize: DEFAULT_PAGE_SIZE,
    customWidth: null,
    customHeight: null,
    zoom: 1.0,
    isDirty: false,
    content: '',
    fileName: null,
    folderHandle: null,
    // プロジェクトフォルダ管理システム用
    projectDirectoryHandle: null,
    currentFileHandle: null,
    projectFolderName: '',
    history: {
        past: [],
        future: [],
    },
    isLocked: false,
    hasPendingChanges: false,
    pendingContent: '',
    pendingSnapshot: null,
    metaMessage: {
        requirements: [],
        notes: [],
        concept: '',
        colors: {
            primary: '#3b82f6',
            secondary: '#1f2937',
            accent: '#fbbf24',
        },
        remarks: '',
    },
    lastSaveTime: 0,
    isImageSaveMode: false,
    cropAspectRatio: null,
    isResponsiveResize: false,
};

export const useEditorStore = create<EditorStore>((set, get) => ({
    ...initialState,

    setPageSize: (pageSize) => set({ pageSize, customWidth: null, customHeight: null }),
    setCustomSize: (width, height) => set({ customWidth: width, customHeight: height }),

    expandCanvas: (neededWidth, neededHeight) => {
        const { pageSize, customWidth, customHeight } = get();
        const config = PAGE_SIZES[pageSize];
        const currentW = customWidth || config.width;
        const currentH = customHeight || config.height;

        if (neededWidth > currentW || neededHeight > currentH) {
            set({
                customWidth: Math.max(currentW, parseInt(neededWidth.toString())),
                customHeight: Math.max(currentH, parseInt(neededHeight.toString()))
            });
        }
    },

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

    // プロジェクトフォルダ管理システム用
    setProjectDirectoryHandle: (projectDirectoryHandle) => set({ projectDirectoryHandle }),
    setCurrentFileHandle: (currentFileHandle) => set({ currentFileHandle }),
    setProjectFolderName: (projectFolderName) => set({ projectFolderName }),

    setLocked: (isLocked) => set({ isLocked }),

    detectExternalUpdate: (newFullContent, snapshot) => {
        const meta = parseMetaMessage(newFullContent);
        const designContent = extractDesignContent(newFullContent);

        set({
            hasPendingChanges: true,
            isLocked: true,
            pendingContent: designContent,
            pendingSnapshot: snapshot,
            // 外部更新時もメタデータを更新（承認待ち状態だが、比較用に保持）
            metaMessage: meta || get().metaMessage,
        });
    },

    approveUpdate: async () => {
        const { pendingContent, folderHandle, fileName, metaMessage } = get();

        // 履歴を積んでから更新
        get().setContent(pendingContent);

        // 承認した場合は、上書き保存後、ロック解除。
        if (folderHandle && fileName) {
            const { fileSystemService } = await import('@/services/fileSystem');
            const fullHtml = constructFullHTML(pendingContent, metaMessage);
            await fileSystemService.saveFile(folderHandle, fileName, fullHtml);
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
        const { content, folderHandle, fileName, metaMessage } = get();

        // 破棄した場合は、AIの変更を破棄し、元のデザインに戻して上書き保存。
        if (folderHandle && fileName) {
            const { fileSystemService } = await import('@/services/fileSystem');
            const fullHtml = constructFullHTML(content, metaMessage);
            await fileSystemService.saveFile(folderHandle, fileName, fullHtml);
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

    setMetaMessage: (meta) => set((state) => ({
        metaMessage: { ...state.metaMessage, ...meta }
    })),
    setLastSaveTime: (lastSaveTime) => set({ lastSaveTime }),
    setImageSaveMode: (isImageSaveMode) => set({ isImageSaveMode, isLocked: isImageSaveMode }),
    setCropAspectRatio: (cropAspectRatio) => set({ cropAspectRatio }),
    setResponsiveResize: (isResponsiveResize) => set({ isResponsiveResize }),
    reset: () => set(initialState),
}));
