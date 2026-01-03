import { useCallback } from 'react';
import { useEditorStore } from '@/store/useEditorStore';

/**
 * 要素（テキスト・画像）をキャンバスに挿入するためのHook
 */
export const useElementInsertion = () => {
    const { content, setContent, setAutoSelectId } = useEditorStore();

    const insertElement = useCallback((html: string) => {
        // 現在のコンテンツの末尾に追加（常に最前面）
        // ※ 本来はここにHTMLフラット化のロジックが必要だが、まずは単純挿入
        setContent(content + html);
    }, [content, setContent]);

    const insertText = useCallback(() => {
        const id = `el-${Math.random().toString(36).substring(2, 9)}`;
        const style = [
            'position: absolute',
            'top: 100px',
            'left: 100px',
            'width: 250px',
            'min-height: 1.5em',
            'padding: 10px',
            'font-family: "Noto Sans JP", sans-serif',
            'font-size: 24px',
            'color: #000000',
            'line-height: 1.4',
            'background-color: transparent',
            'word-break: break-word'
        ].join('; ');

        const html = `<div id="${id}" style="${style}">新しいテキスト</div>`;
        insertElement(html);
        setAutoSelectId(id);
    }, [insertElement, setAutoSelectId]);

    const insertImage = useCallback((imagePath: string) => {
        const id = `el-${Math.random().toString(36).substring(2, 9)}`;
        const style = [
            'position: absolute',
            'top: 100px',
            'left: 100px',
            'width: 400px',
            'height: auto'
        ].join('; ');

        const html = `<img id="${id}" src="${imagePath}" style="${style}" alt="" />`;
        insertElement(html);
    }, [insertElement]);

    return {
        insertText,
        insertImage
    };
};
