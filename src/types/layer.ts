export type LayerType = 'text' | 'image' | 'shape' | 'group' | 'unknown';

export interface LayerData {
    id: string;
    label: string;
    type: LayerType;
    groupId: string | null;
    elementIds: string[];
    isVisible: boolean;
    isLocked: boolean;
    style?: string;    // インラインスタイル
    content?: string;  // テキスト内容など
    src?: string;      // 画像URLなど
}
