import { getElementRotation, rotatePoint } from '@/utils/rotationUtils';

/**
 * 回転操作に関するアクションを提供するサービス層
 */
export const rotationService = {
    /**
     * 要素を現在の角度から指定された角度だけ左に（反時計回り）に回転させる
     * 90度回転の要件は「左に90度」
     */
    rotate90Left(targets: HTMLElement[]): void {
        targets.forEach(el => {
            const currentRotation = getElementRotation(el);
            const newRotation = currentRotation - 90;
            console.log(`[rotationService] rotate90Left id=${el.id}, current=${currentRotation}, new=${newRotation}`);
            this.setRotation(el, newRotation);
        });
    },

    /**
     * グループ全体を90度左に回転させる
     */
    rotateGroup90Left(overlay: HTMLElement, members: HTMLElement[]): void {
        const cx = parseFloat(overlay.style.left) + parseFloat(overlay.style.width) / 2;
        const cy = parseFloat(overlay.style.top) + parseFloat(overlay.style.height) / 2;

        // 1. 各要素の位置と向きを回転
        members.forEach(el => {
            const currentL = parseFloat(el.style.left) || 0;
            const currentT = parseFloat(el.style.top) || 0;

            // 座標の回転 (-90度)
            const newPos = rotatePoint(currentL, currentT, cx, cy, -90);
            el.style.left = `${newPos.x}px`;
            el.style.top = `${newPos.y}px`;

            // 向きの回転
            this.rotate90Left([el]);
        });

        // 2. オーバーレイ自体の向きも更新（一貫性のため）
        this.rotate90Left([overlay]);
    },

    /**
     * 要素の回転をリセットにする
     * 個別要素を0度に戻すのではなく、グループ作成時点の傾き状態に戻す（あれば）
     */
    resetRotation(targets: HTMLElement[]): void {
        targets.forEach(el => {
            const initialRotate = el.getAttribute('data-initial-rotate');
            const targetRotate = initialRotate ? parseFloat(initialRotate) : 0;
            console.log(`[rotationService] resetRotation id=${el.id}, initial=${initialRotate}, target=${targetRotate}`);
            this.setRotation(el, targetRotate);
        });
    },

    /**
     * 指定された角度を適用する
     */
    setRotation(el: HTMLElement, degree: number): void {
        const transform = el.style.transform || '';
        let newTransform = '';
        if (transform.includes('rotate(')) {
            newTransform = transform.replace(/rotate\(([-\d.]+)deg\)/, `rotate(${degree}deg)`);
        } else {
            newTransform = `${transform} rotate(${degree}deg)`.trim();
        }

        const isInDOM = document.body.contains(el);
        const isSelected = el.classList.contains('moveable-target-active') || el.classList.contains('group-selection-overlay');
        console.log(`[rotationService] setRotation id=${el.id}, inDOM=${isInDOM}, isSelected=${isSelected}, old=${transform}, next=${newTransform}`);

        el.style.transform = newTransform;
    }
};
