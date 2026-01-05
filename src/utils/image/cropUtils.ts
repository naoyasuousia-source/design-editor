/**
 * Logic層: トリミングに関する純粋な計算（数学的処理）を担当。
 * 副作用や DOM 操作は一切行わない。
 */

export interface CropRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Size {
    width: number;
    height: number;
}

export const cropUtils = {
    /**
     * 要素の背景情報やオブジェクト情報を解析し、内部の画像スケールとオフセットを計算する
     */
    parseImageLayout(params: {
        rect: DOMRect;
        style: CSSStyleDeclaration;
        naturalSize: Size;
        zoom: number;
    }) {
        const { rect, style, naturalSize, zoom } = params;
        const NW = naturalSize.width;
        const NH = naturalSize.height;

        const borderL = parseFloat(style.borderLeftWidth) || 0;
        const borderT = parseFloat(style.borderTopWidth) || 0;
        const borderR = parseFloat(style.borderRightWidth) || 0;
        const borderB = parseFloat(style.borderBottomWidth) || 0;
        const paddingL = parseFloat(style.paddingLeft) || 0;
        const paddingT = parseFloat(style.paddingTop) || 0;

        const contentW = (rect.width / zoom) - borderL - borderR - paddingL - (parseFloat(style.paddingRight) || 0);
        const contentH = (rect.height / zoom) - borderT - borderB - paddingT - (parseFloat(style.paddingBottom) || 0);

        let s = 1;
        let offX = 0;
        let offY = 0;

        const bgImg = style.backgroundImage;
        if (bgImg && bgImg !== 'none') {
            const bgSizeStr = style.backgroundSize;
            if (bgSizeStr.includes('px')) {
                s = parseFloat(bgSizeStr.split(' ')[0]) / NW;
            } else {
                s = (parseFloat(bgSizeStr.split(' ')[0]) || 100) / 100 * contentW / NW;
            }

            const bgPosStr = style.backgroundPosition;
            if (bgPosStr.includes('px')) {
                offX = parseFloat(bgPosStr.split(' ')[0]);
                offY = parseFloat(bgPosStr.split(' ')[1] || bgPosStr.split(' ')[0]);
            } else {
                const parsePct = (v: string) => v.includes('%') ? parseFloat(v) : 50;
                offX = (contentW - NW * s) * (parsePct(bgPosStr.split(' ')[0]) / 100);
                offY = (contentH - NH * s) * (parsePct(bgPosStr.split(' ')[1] || bgPosStr.split(' ')[0]) / 100);
            }
        } else {
            // object-fit: cover 相当の推論
            s = Math.max(contentW / NW, contentH / NH);
            const parsePct = (v: string) => v.includes('%') ? parseFloat(v) : 50;
            const pos = (style.objectPosition || '50% 50%').split(' ');
            offX = (contentW - NW * s) * (parsePct(pos[0]) / 100);
            offY = (contentH - NH * s) * (parsePct(pos[1] || pos[0]) / 100);
        }

        return {
            scale: s,
            offX,
            offY,
            fullW: NW * s,
            fullH: NH * s,
            contentW,
            contentH,
            borders: { left: borderL, top: borderT },
            paddings: { left: paddingL, top: paddingT }
        };
    },

    /**
     * アスペクト比に応じた初期トリミング枠を計算
     */
    calculateInitialCropRect(fullSize: Size, aspectRatio: number | null): CropRect {
        let finalW = fullSize.width;
        let finalH = fullSize.height;
        let startX = 0;
        let startY = 0;

        if (aspectRatio) {
            if (fullSize.width / fullSize.height > aspectRatio) {
                finalW = fullSize.height * aspectRatio;
                startX = (fullSize.width - finalW) / 2;
            } else {
                finalH = fullSize.width / aspectRatio;
                startY = (fullSize.height - finalH) / 2;
            }
        }

        return { x: startX, y: startY, width: finalW, height: finalH };
    },

    /**
     * ドラッグ移動後の矩形を計算
     */
    calculateMove(params: {
        startRect: CropRect;
        deltaX: number;
        deltaY: number;
        elementSize: Size;
    }): { x: number; y: number } {
        const { startRect, deltaX, deltaY, elementSize } = params;
        return {
            x: Math.max(0, Math.min(elementSize.width - startRect.width, startRect.x + deltaX)),
            y: Math.max(0, Math.min(elementSize.height - startRect.height, startRect.y + deltaY))
        };
    },

    /**
     * リサイズ後の矩形を計算
     */
    calculateResize(params: {
        startRect: CropRect;
        deltaX: number;
        deltaY: number;
        elementSize: Size;
        aspectRatio: number | null;
    }): { width: number; height: number } {
        const { startRect, deltaX, deltaY, elementSize, aspectRatio } = params;
        let w = startRect.width + deltaX;
        let h = startRect.height + deltaY;

        if (aspectRatio) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) h = w / aspectRatio;
            else w = h * aspectRatio;
        }

        w = Math.max(10, Math.min(elementSize.width - startRect.x, w));
        h = Math.max(10, Math.min(elementSize.height - startRect.y, h));

        if (aspectRatio) {
            if (w / h > aspectRatio) w = h * aspectRatio;
            else h = w / aspectRatio;
        }

        return { width: w, height: h };
    },

    /**
     * 背景画像用のスタイルオブジェクトを生成
     */
    generateBackgroundStyles(params: {
        cropRect: CropRect;
        naturalSize: Size;
        fullSize: Size;
        url: string;
    }) {
        const { cropRect, naturalSize, fullSize, url } = params;
        const scale = fullSize.width / naturalSize.width;

        return {
            backgroundImage: `url("${url}")`,
            backgroundSize: `${naturalSize.width * scale}px ${naturalSize.height * scale}px`,
            backgroundPosition: `${-cropRect.x}px ${-cropRect.y}px`,
            backgroundRepeat: 'no-repeat',
            width: `${cropRect.width}px`,
            height: `${cropRect.height}px`
        };
    }
};
