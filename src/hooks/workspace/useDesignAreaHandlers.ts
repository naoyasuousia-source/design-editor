import { useCallback } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { designAreaService } from '@/services/designAreaService';

interface UseDesignAreaHandlersProps {
    canvasRef: React.RefObject<HTMLDivElement | null>;
    imageUrls: Record<string, string>;
    updateContentFromDOM: () => void;
}

export const useDesignAreaHandlers = ({
    canvasRef,
    imageUrls,
    updateContentFromDOM
}: UseDesignAreaHandlersProps) => {
    const onPaste = useCallback((e: React.ClipboardEvent) => {
        const target = e.target as HTMLElement;
        if (target.contentEditable === 'true') {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
        }
    }, []);

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }, []);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const imagePath = e.dataTransfer.getData('text/plain');
        if (!imagePath || !imagePath.startsWith('./images/')) return;

        const fileName = imagePath.replace('./images/', '');
        const displayPath = imageUrls[fileName] || imagePath;

        if (!canvasRef.current) return;

        // 指定範囲（canvasRef）内からのみ要素を特定する
        const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
        if (!element || !canvasRef.current.contains(element)) return;

        const target = element.closest('.DesignSurface > *, .DesignSurface *') as HTMLElement;
        if (!target) return;

        designAreaService.applyDroppedImage(target, displayPath);
        updateContentFromDOM();
    }, [imageUrls, canvasRef, updateContentFromDOM]);

    return {
        onPaste,
        onDragOver,
        onDrop
    };
};
