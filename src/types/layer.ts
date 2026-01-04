export type LayerType = 'text' | 'image' | 'shape' | 'group' | 'unknown';

export interface LayerData {
    id: string;
    label: string;
    type: LayerType;
    groupId: string | null;
    elementIds: string[];
    isVisible: boolean;
    isLocked: boolean;
}
