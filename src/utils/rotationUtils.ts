/**
 * 要素の回転に関するユーティリティ
 */

/**
 * HTMLElement から現在の回転角度（deg）を取得する
 */
export const getElementRotation = (el: HTMLElement): number => {
    const transform = el.style.transform;
    if (!transform) return 0;

    const match = transform.match(/rotate\(([-\d.]+)deg\)/);
    if (match) {
        return parseFloat(match[1]);
    }

    // transform プロパティがマトリックスの場合の対応（必要に応じて）
    const st = window.getComputedStyle(el, null);
    const tr = st.getPropertyValue("transform");
    if (tr && tr !== "none") {
        const values = tr.split('(')[1].split(')')[0].split(',');
        const a = parseFloat(values[0]);
        const b = parseFloat(values[1]);
        const angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
        return angle < 0 ? angle + 360 : angle;
    }

    return 0;
};

/**
 * transform 文字列をパースして各コンポーネントを取得する
 */
export const parseTransform = (transform: string) => {
    const rotateMatch = transform.match(/rotate\(([-\d.]+)deg\)/);
    const translateMatch = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);

    return {
        rotate: rotateMatch ? parseFloat(rotateMatch[1]) : 0,
        translate: translateMatch ? {
            x: parseFloat(translateMatch[1]),
            y: parseFloat(translateMatch[2])
        } : { x: 0, y: 0 }
    };
};

/**
 * 点 (x, y) を 中心 (cx, cy) のまわりに angle 度回転させた座標を返す
 */
export const rotatePoint = (x: number, y: number, cx: number, cy: number, angle: number) => {
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = x - cx;
    const dy = y - cy;
    return {
        x: cos * dx - sin * dy + cx,
        y: sin * dx + cos * dy + cy
    };
};
