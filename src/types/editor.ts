export type PageSize = 'A4' | '9:16' | 'SQUARE';

export interface PageConfig {
    width: number;
    height: number;
    label: string;
}

export const PAGE_SIZES: Record<PageSize, PageConfig> = {
    'A4': { width: 794, height: 1123, label: 'A4 (210x297mm)' },
    '9:16': { width: 630, height: 1120, label: '9:16 (Story)' },
    'SQUARE': { width: 800, height: 800, label: '正方形 (1:1)' },
};

export interface MetaMessage {
    requirements: string[];
    notes: string[];
    concept: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
    };
    remarks: string;
    pageSize?: PageSize;
}

export type EditorState = {
    pageSize: PageSize;
    customWidth: number | null;
    customHeight: number | null;
    zoom: number;
    isDirty: boolean;
    content: string; // HTML string
    customCss: string; // CSS within <!-- CUSTOM_CSS_START -->
    fileName: string | null;
    folderHandle: FileSystemDirectoryHandle | null;
    // プロジェクトフォルダ管理システム用
    projectDirectoryHandle: FileSystemDirectoryHandle | null;
    currentFileHandle: FileSystemFileHandle | null;
    projectFolderName: string;
    history: {
        past: string[];
        future: string[];
    };
    // 承認フロー用
    isLocked: boolean;
    isApplyingUpdate: boolean;
    hasPendingChanges: boolean;
    pendingContent: string;
    prePendingContent: string;
    pendingSnapshot: string | null; // Base64
    metaMessage: MetaMessage;
    lastSaveTime: number;
    // 画像保存ウィザード用
    isImageSaveMode: boolean;
    cropAspectRatio: number | 'free' | null;
    isResponsiveResize: boolean;
    // UI状態
    showSaveToast: boolean;
    autoSelectId: string | null;
    isImageCropMode: boolean;
    imageCropAspectRatio: number | null;
    croppingElementId: string | null;
}

export const _REFRESH_FIX = Date.now();
