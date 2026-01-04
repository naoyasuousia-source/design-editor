import type { PageSize } from '@/types/editor';

export const GET_INITIAL_TEMPLATE = (size: PageSize): string => {
    const groupId = `group-${Math.random().toString(36).substr(2, 9)}`;
    const titleId = `el-${Math.random().toString(36).substr(2, 9)}`;
    const descId = `el-${Math.random().toString(36).substr(2, 9)}`;

    switch (size) {
        case 'A4':
            // A4: 794 x 1123. 80% width = 635px. Left = (794-635)/2 = 79.5 -> 80px.
            return `
                <div id="${titleId}" data-group-id="${groupId}" style="position: absolute; top: 120px; left: 80px; width: 635px; text-align: center; font-family: 'Noto Sans JP', sans-serif; font-size: 48px; color: #1a1a1a; font-weight: bold;">新規ドキュメント</div>
                <div id="${descId}" data-group-id="${groupId}" style="position: absolute; top: 220px; left: 80px; width: 635px; text-align: center; font-family: 'Noto Sans JP', sans-serif; font-size: 18px; color: #666; line-height: 1.6;">
                    ここにデザインの内容を記述します。ツールバーの「挿入」メニューから要素を追加したり、
                    AIに指示を出してデザインを生成させることができます。
                </div>
            `.trim();
        case '9:16':
            // 9:16: 630 x 1120. 80% width = 504px. Left = (630-504)/2 = 63px.
            const lineId = `el-${Math.random().toString(36).substr(2, 9)}`;
            return `
                <div id="${titleId}" data-group-id="${groupId}" style="position: absolute; top: 220px; left: 63px; width: 504px; font-family: 'Oswald', sans-serif; font-size: 64px; color: #3b82f6; text-transform: uppercase; line-height: 1; font-weight: bold;">Fresh<br>Design</div>
                <div id="${lineId}" data-group-id="${groupId}" style="position: absolute; top: 360px; left: 63px; width: 50px; height: 4px; background: #3b82f6;"></div>
                <div id="${descId}" data-group-id="${groupId}" style="position: absolute; top: 390px; left: 63px; width: 504px; font-family: 'Inter', sans-serif; font-size: 16px; color: #4b5563;">
                    Vertical content for mobile or stories.
                </div>
            `.trim();
        case 'SQUARE':
            // SQUARE: 800 x 800.
            return `
                <div id="${titleId}" data-group-id="${groupId}" style="position: absolute; top: 280px; left: 160px; width: 480px; font-family: 'Playfair Display', serif; font-size: 64px; color: #1a1a1a; text-align: center; font-weight: bold;">TITLE HERE</div>
                <div id="${descId}" data-group-id="${groupId}" style="position: absolute; top: 400px; left: 160px; width: 480px; font-family: 'Montserrat', sans-serif; font-size: 24px; color: #666; text-transform: uppercase; letter-spacing: 0.1em; text-align: center;">Description here</div>
            `.trim();
        default:
            return '';
    }
};
