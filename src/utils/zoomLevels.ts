/**
 * ズーム倍率に関するユーティリティ関数
 */

/**
 * 利用可能なズーム倍率の配列を生成する
 * - 50%～150%: 10%刻み
 * - 150%～300%: 25%刻み
 * @returns ズーム倍率の配列（小数形式: 0.5, 0.6, ..., 3.0）
 */
export const getAvailableZoomLevels = (): number[] => {
    const levels: number[] = [];

    // 50%～150%: 10%刻み
    for (let i = 50; i <= 150; i += 10) {
        levels.push(i / 100);
    }

    // 150%超～300%: 25%刻み
    for (let i = 175; i <= 300; i += 25) {
        levels.push(i / 100);
    }

    return levels;
};

/**
 * 現在のズーム値に最も近い利用可能なズーム倍率を取得する
 * @param currentZoom 現在のズーム値
 * @returns 最も近い利用可能なズーム倍率
 */
export const getNearestZoomLevel = (currentZoom: number): number => {
    const levels = getAvailableZoomLevels();

    return levels.reduce((nearest, level) => {
        return Math.abs(level - currentZoom) < Math.abs(nearest - currentZoom)
            ? level
            : nearest;
    });
};

/**
 * 次のズーム倍率を取得する（拡大）
 * @param currentZoom 現在のズーム値
 * @returns 次のズーム倍率、最大値の場合は現在値
 */
export const getNextZoomLevel = (currentZoom: number): number => {
    const levels = getAvailableZoomLevels();
    const nextLevel = levels.find(level => level > currentZoom);

    return nextLevel ?? levels[levels.length - 1];
};

/**
 * 前のズーム倍率を取得する（縮小）
 * @param currentZoom 現在のズーム値
 * @returns 前のズーム倍率、最小値の場合は現在値
 */
export const getPreviousZoomLevel = (currentZoom: number): number => {
    const levels = getAvailableZoomLevels();

    // 逆順で検索
    for (let i = levels.length - 1; i >= 0; i--) {
        if (levels[i] < currentZoom) {
            return levels[i];
        }
    }

    return levels[0];
};
