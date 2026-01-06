import { create } from 'zustand';
import type { EditorState, PageSize } from '@/types/editor';
import { PAGE_SIZES } from '@/types/editor';
import { DEFAULT_PAGE_SIZE } from '@/constants/editor';
import { parseMetaMessage, constructFullHTML, extractCustomCss } from '@/utils/htmlProcessing';
import { htmlService } from '@/services/htmlService';

interface EditorStore extends EditorState {
    setPageSize: (size: PageSize) => void;
    setCustomSize: (width: number | null, height: number | null) => void;
    expandCanvas: (neededWidth: number, neededHeight: number) => void;
    setZoom: (zoom: number) => void;
    setDirty: (isDirty: boolean) => void;
    setContent: (content: string, skipHistory?: boolean) => void;
    setCustomCss: (css: string) => void;
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
    detectExternalUpdate: (newFullContent: string, snapshot: string | null) => void;
    setApplyingUpdate: (isApplying: boolean) => void;
    approveUpdate: () => Promise<void>;
    discardUpdate: () => Promise<void>;
    setMetaMessage: (meta: Partial<import('@/types/editor').MetaMessage>) => void;
    setLastSaveTime: (time: number) => void;
    setImageSaveMode: (enabled: boolean) => void;
    setCropAspectRatio: (ratio: number | 'free' | null) => void;
    setResponsiveResize: (enabled: boolean) => void;
    setShowSaveToast: (show: boolean) => void;
    setAutoSelectId: (id: string | null) => void;
    setSelectedIds: (ids: string[]) => void;
    setImageCropMode: (enabled: boolean, elementId: string | null, aspectRatio?: number | null) => void;
    setLayerSidebarOpen: (open: boolean) => void;
    triggerDeselect: () => void;
    resetDeselectTrigger: () => void;
    setAssets: (assets: { imageUrls: Record<string, string>, imageFiles: string[], htmlFiles: string[] }) => void;
    reset: () => void;
}

const MAX_HISTORY = 50;

const initialState: EditorState = {
    pageSize: DEFAULT_PAGE_SIZE,
    customWidth: null,
    customHeight: null,
    zoom: 1.0,
    isDirty: false,
    content: '',
    customCss: '',
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
    isApplyingUpdate: false,
    hasPendingChanges: false,
    pendingContent: '',
    prePendingContent: '',
    pendingSnapshot: null,
    metaMessage: {
        fixedRules: '',
        collaborativeRules: '',
        designConcept: '',
        colors: {
            main: 'none',
            sub: 'none',
            accent: 'none',
        },
        colorKit: 'custom',
    },
    lastSaveTime: 0,
    isImageSaveMode: false,
    cropAspectRatio: null,
    isResponsiveResize: false,
    showSaveToast: false,
    autoSelectId: null,
    selectedIds: [],
    isImageCropMode: false,
    imageCropAspectRatio: null,
    croppingElementId: null,
    isLayerSidebarOpen: false,
    isDeselectTriggered: false,
    imageUrls: {},
    imageFiles: [],
    htmlFiles: [],
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

    setCustomCss: (customCss) => set({ customCss, isDirty: true }),

    setFileName: (fileName) => set({ fileName }),
    setFolderHandle: (folderHandle) => set({ folderHandle }),

    // プロジェクトフォルダ管理システム用
    setProjectDirectoryHandle: (projectDirectoryHandle) => set({ projectDirectoryHandle }),
    setCurrentFileHandle: (currentFileHandle) => set({ currentFileHandle }),
    setProjectFolderName: (projectFolderName) => set({ projectFolderName }),

    setLocked: (isLocked) => set({ isLocked }),

    detectExternalUpdate: (newFullContent, snapshot) => {
        const { content } = get();
        const meta = parseMetaMessage(newFullContent);
        const designContent = htmlService.extractDesignContent(newFullContent);
        const newCustomCss = extractCustomCss(newFullContent);

        set({
            hasPendingChanges: true,
            isLocked: true,
            isApplyingUpdate: true,
            prePendingContent: content,
            content: designContent,
            customCss: newCustomCss,
            pendingContent: designContent,
            pendingSnapshot: snapshot,
            metaMessage: meta || get().metaMessage,
            pageSize: (meta && meta.pageSize) ? meta.pageSize : get().pageSize,
        });
    },

    setApplyingUpdate: (isApplyingUpdate) => set({ isApplyingUpdate }),

    approveUpdate: async () => {
        const { content, currentFileHandle, metaMessage } = get();

        // 承認した場合は、すでに反映されている content をファイルに保存する
        if (currentFileHandle) {
            const { fileSystemService } = await import('@/services/fileSystem');
            const fullHtml = constructFullHTML(content, '', metaMessage);
            await fileSystemService.saveToCurrentFile(currentFileHandle, fullHtml);
        }

        set({
            hasPendingChanges: false,
            isLocked: false,
            isApplyingUpdate: false,
            pendingContent: '',
            prePendingContent: '',
            pendingSnapshot: null,
            isDirty: false,
            lastSaveTime: Date.now(),
        });
    },

    discardUpdate: async () => {
        const { prePendingContent, currentFileHandle, metaMessage } = get();

        // 破棄した場合は、退避しておいた prePendingContent に戻して上書き保存。
        if (currentFileHandle) {
            const { fileSystemService } = await import('@/services/fileSystem');
            const fullHtml = constructFullHTML(prePendingContent, '', metaMessage);
            await fileSystemService.saveToCurrentFile(currentFileHandle, fullHtml);
        }

        set({
            content: prePendingContent,
            hasPendingChanges: false,
            isLocked: false,
            isApplyingUpdate: false,
            pendingContent: '',
            prePendingContent: '',
            pendingSnapshot: null,
            lastSaveTime: Date.now(),
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
    setShowSaveToast: (showSaveToast) => set({ showSaveToast }),
    setAutoSelectId: (autoSelectId) => set({ autoSelectId }),
    setSelectedIds: (selectedIds) => set({ selectedIds }),
    setImageCropMode: (enabled, elementId, aspectRatio = null) => set({ isImageCropMode: enabled, croppingElementId: elementId, imageCropAspectRatio: aspectRatio, isLocked: enabled }),
    setLayerSidebarOpen: (isLayerSidebarOpen) => set({ isLayerSidebarOpen }),
    triggerDeselect: () => set({ isDeselectTriggered: true }),
    resetDeselectTrigger: () => set({ isDeselectTriggered: false }),
    setAssets: (assets) => set({ ...assets }),
    reset: () => set(initialState),
}));
