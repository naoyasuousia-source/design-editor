import { useMemo, useCallback } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { parseLayers, updateLayerOrder } from '@/utils/layerUtils';
import { elementService } from '@/services/elementService';
import type { LayerData } from '@/types/layer';

export const useLayers = () => {
    const { content, setContent } = useEditorStore();

    const layers = useMemo(() => {
        return parseLayers(content);
    }, [content]);

    const handleReorder = useCallback((dragId: string, hoverId: string, position: 'above' | 'below' = 'below') => {
        if (dragId === hoverId) return;
        const newContent = updateLayerOrder(content, dragId, hoverId, position);
        setContent(newContent);
    }, [content, setContent]);

    const selectLayer = useCallback((layer: LayerData, e: React.MouseEvent) => {
        const { selectedIds, setSelectedIds } = useEditorStore.getState();
        const layerIds = layer.elementIds;

        if (e.shiftKey && selectedIds.length > 0) {
            // シフト選択：現在の選択範囲の端点を見つける
            const lastSelectedId = selectedIds[selectedIds.length - 1];

            const lastIdx = layers.findIndex(l => l.elementIds.includes(lastSelectedId));
            const currentIdx = layers.findIndex(l => l.id === layer.id);

            if (lastIdx !== -1 && currentIdx !== -1) {
                const start = Math.min(lastIdx, currentIdx);
                const end = Math.max(lastIdx, currentIdx);
                const rangeLayers = layers.slice(start, end + 1);
                const newIds = Array.from(new Set([...selectedIds, ...rangeLayers.flatMap(l => l.elementIds)]));
                setSelectedIds(newIds);
                return;
            }
        }

        // 基本は単一選択（またはトグルっぽく振る舞う）
        // 外部に通知するために autoSelectId を使う（これにより Moveable も同期する）
        useEditorStore.getState().setAutoSelectId(layerIds[0]);
    }, [layers]);

    const handleGroupElements = useCallback(() => {
        const { selectedIds, content, setContent } = useEditorStore.getState();
        if (selectedIds.length < 2) return;

        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const surface = doc.querySelector('.DesignSurface') || doc.body;

        // 選択された要素を取得
        const elements = selectedIds.map(id => doc.getElementById(id)).filter((el): el is HTMLElement => !!el);
        if (elements.length < 2) return;

        const newGroupId = elementService.groupElements(elements);

        if (newGroupId) {
            const newContent = surface.classList.contains('DesignSurface') ? surface.outerHTML : surface.innerHTML;
            setContent(newContent);
            // グループ化後、新しいグループ内の全要素を選択状態にする
            const groupElements = Array.from(surface.children).filter(el => el.getAttribute('data-group-id') === newGroupId);
            useEditorStore.getState().setSelectedIds(groupElements.map(el => el.id));
        }
    }, []);

    return {
        layers,
        handleReorder,
        selectLayer,
        handleGroupElements
    };
};
