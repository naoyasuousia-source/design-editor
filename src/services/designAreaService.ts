/**
 * DesignArea に関する命令的な DOM 操作を担当する
 */
export const designAreaService = {
    /**
     * ドロップされた画像をターゲット要素に適用する
     */
    applyDroppedImage(target: HTMLElement, imagePath: string): void {
        if (target.tagName.toLowerCase() === 'img') {
            (target as HTMLImageElement).src = imagePath;
        } else {
            target.style.backgroundImage = `url('${imagePath}')`;
            target.style.backgroundSize = 'contain';
            target.style.backgroundRepeat = 'no-repeat';
            target.style.backgroundPosition = 'center';
        }
    }
};
