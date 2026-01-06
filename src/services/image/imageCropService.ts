import type { CropRect } from '@/types/image';

/**
 * Action層: 命令的な DOM 操作（副作用）を担当。
 * 計算自体は utils/ から取得した結果を適用するのみとする。
 */
export const imageCropService = {
    /**
     * 既存の img 要素を div 要素に変換し、属性を引き継ぐ
     */
    convertImgToDiv(img: HTMLImageElement): HTMLDivElement {
        const div = document.createElement('div');
        Array.from(img.attributes).forEach(attr => {
            if (attr.name !== 'src') { // style も含めて全ての属性を一旦引き継ぐ
                div.setAttribute(attr.name, attr.value);
            }
        });
        img.parentNode?.replaceChild(div, img);
        return div;
    },

    /**
     * トリミング結果を要素に適用する
     */
    applyFinalCrop(params: {
        target: HTMLElement;
        styles: any;
        transform: string;
    }): HTMLElement {
        const { target, styles, transform } = params;
        let finalTarget = target;

        // img を div に変換 (背景画像を持てるようにするため)
        if (target instanceof HTMLImageElement) {
            finalTarget = this.convertImgToDiv(target);
        }

        // スタイルと transform の適用
        Object.assign(finalTarget.style, styles);
        finalTarget.style.transform = transform;
        finalTarget.style.objectFit = '';
        finalTarget.style.objectPosition = '';

        return finalTarget;
    },

    /**
     * Temporary UI の更新 (高頻度なドラッグ中の描画など)
     */
    updatePreview(params: {
        cropBox: HTMLElement;
        previewImg: HTMLImageElement;
        resizeHandle: HTMLElement;
        cropRect: CropRect;
        fullSize: { width: number; height: number };
        zoom: number;
    }) {
        const { cropBox, previewImg, resizeHandle, cropRect, fullSize, zoom } = params;

        // 枠の更新
        cropBox.style.left = `${cropRect.x * zoom}px`;
        cropBox.style.top = `${cropRect.y * zoom}px`;
        cropBox.style.width = `${cropRect.width * zoom}px`;
        cropBox.style.height = `${cropRect.height * zoom}px`;

        // プレビュー画像の更新（枠内での位置合わせ）
        previewImg.style.left = `${-cropRect.x * zoom}px`;
        previewImg.style.top = `${-cropRect.y * zoom}px`;
        previewImg.style.width = `${fullSize.width * zoom}px`;
        previewImg.style.height = `${fullSize.height * zoom}px`;

        // リサイズハンドルの更新
        resizeHandle.style.left = `${(cropRect.x + cropRect.width) * zoom - 12}px`;
        resizeHandle.style.top = `${(cropRect.y + cropRect.height) * zoom - 12}px`;
    }
};
