import { useMemo, useCallback } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { parseLayers, updateLayerOrder } from '@/utils/layerUtils';
import type { LayerData } from '@/types/layer';

export const useLayers = () => {
    const { content, setContent } = useEditorStore();

    const layers = useMemo(() => {
        return parseLayers(content);
    }, [content]);

    const handleReorder = useCallback((dragId: string, hoverId: string) => {
        if (dragId === hoverId) return;
        const newContent = updateLayerOrder(content, dragId, hoverId);
        setContent(newContent);
    }, [content, setContent]);

    const selectLayer = useCallback((layer: LayerData) => {
        // useMoveable などの選択ロジックと同期するための仕組み
        // ここでは一旦、autoSelectId をセットして Workspace 側に通知する
        useEditorStore.getState().setAutoSelectId(layer.elementIds[0]);
    }, []);

    return {
        layers,
        handleReorder,
        selectLayer
    };
};
