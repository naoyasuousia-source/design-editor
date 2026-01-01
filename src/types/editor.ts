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
}

export type EditorState = {
    pageSize: PageSize;
    customWidth: number | null;
    customHeight: number | null;
    zoom: number;
    isDirty: boolean;
    content: string; // HTML string
    fileName: string | null;
    folderHandle: FileSystemDirectoryHandle | null;
    history: {
        past: string[];
        future: string[];
    };
    // 承認フロー用
    isLocked: boolean;
    hasPendingChanges: boolean;
    pendingContent: string;
    pendingSnapshot: string | null; // Base64
    metaMessage: MetaMessage;
    lastSaveTime: number;
}
