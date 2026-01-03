import type { PageSize } from '@/types/editor';

export const GET_INITIAL_TEMPLATE = (size: PageSize): string => {
    const groupId = `group-${Math.random().toString(36).substr(2, 9)}`;
    const bgId = `el-${Math.random().toString(36).substr(2, 9)}`;
    const titleId = `el-${Math.random().toString(36).substr(2, 9)}`;
    const descId = `el-${Math.random().toString(36).substr(2, 9)}`;

    switch (size) {
        case 'A4':
            return `
                <div id="${titleId}" data-group-id="${groupId}" style="position: absolute; top: 120px; left: 50%; transform: translateX(-50%); width: 80%; text-align: center; font-family: 'Noto Sans JP', sans-serif; font-size: 48px; color: #1a1a1a; font-weight: bold;">新規ドキュメント</div>
                <div id="${descId}" data-group-id="${groupId}" style="position: absolute; top: 220px; left: 50%; transform: translateX(-50%); width: 80%; text-align: center; font-family: 'Noto Sans JP', sans-serif; font-size: 18px; color: #666; line-height: 1.6;">
                    ここにデザインの内容を記述します。ツールバーの「挿入」メニューから要素を追加したり、
                    AIに指示を出してデザインを生成させることができます。
                </div>
            `.trim();
        case '9:16':
            const lineId = `el-${Math.random().toString(36).substr(2, 9)}`;
            return `
                <div id="${titleId}" data-group-id="${groupId}" style="position: absolute; top: 20%; left: 10%; width: 80%; font-family: 'Oswald', sans-serif; font-size: 64px; color: #3b82f6; text-transform: uppercase; line-height: 1; font-weight: bold;">Fresh<br>Design</div>
                <div id="${lineId}" data-group-id="${groupId}" style="position: absolute; top: calc(20% + 140px); left: 10%; width: 50px; height: 4px; background: #3b82f6;"></div>
                <div id="${descId}" data-group-id="${groupId}" style="position: absolute; top: calc(20% + 170px); left: 10%; width: 80%; font-family: 'Inter', sans-serif; font-size: 16px; color: #4b5563;">
                    Vertical content for mobile or stories.
                </div>
            `.trim();
        case 'SQUARE':
            return `
                <div id="${bgId}" data-group-id="${groupId}" style="position: absolute; top: 100px; left: 100px; width: 600px; height: 600px; border: 4px solid black; background-color: #ffffff;"></div>
                <div id="${titleId}" data-group-id="${groupId}" style="position: absolute; top: 280px; left: 160px; width: 480px; font-family: 'Playfair Display', serif; font-size: 64px; color: #1a1a1a; text-align: center; font-weight: bold;">TITLE HERE</div>
                <div id="${descId}" data-group-id="${groupId}" style="position: absolute; top: 400px; left: 160px; width: 480px; font-family: 'Montserrat', sans-serif; font-size: 24px; color: #666; text-transform: uppercase; letter-spacing: 0.1em; text-align: center;">Description here</div>
            `.trim();
        default:
            return '';
    }
};
