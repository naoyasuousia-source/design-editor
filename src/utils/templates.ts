import type { PageSize } from '@/types/editor';

export const GET_INITIAL_TEMPLATE = (size: PageSize): string => {
    const id = `el-${Math.random().toString(36).substr(2, 9)}`;
    const titleId = `el-${Math.random().toString(36).substr(2, 9)}`;
    const descId = `el-${Math.random().toString(36).substr(2, 9)}`;

    switch (size) {
        case 'A4':
            return `
                <div id="${id}" style="position: absolute; top: 100px; left: 50%; transform: translateX(-50%); width: 80%; text-align: center;">
                    <h1 id="${titleId}" style="font-family: 'Noto Sans JP', sans-serif; font-size: 48px; color: #1a1a1a; margin-bottom: 20px;">新規ドキュメント</h1>
                    <p id="${descId}" style="font-family: 'Noto Sans JP', sans-serif; font-size: 18px; color: #666; line-height: 1.6;">
                        ここにデザインの内容を記述します。左側のサイドバーから要素を追加したり、
                        AIに指示を出してデザインを生成させることができます。
                    </p>
                </div>
            `.trim();
        case '9:16':
            return `
                <div id="${id}" style="position: absolute; top: 20%; left: 10%; width: 80%;">
                    <h1 id="${titleId}" style="font-family: 'Oswald', sans-serif; font-size: 64px; color: #3b82f6; text-transform: uppercase; line-height: 1;">Fresh<br>Design</h1>
                    <div style="width: 50px; height: 4px; background: #3b82f6; margin: 20px 0;"></div>
                    <p id="${descId}" style="font-family: 'Inter', sans-serif; font-size: 16px; color: #4b5563;">
                        Vertical content for mobile or stories.
                    </p>
                </div>
            `.trim();
        case 'SQUARE':
            return `
                <div id="${id}" style="position: absolute; top: 100px; left: 100px; width: 600px; height: 600px; border: 4px solid black; background: white; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px;">
                    <div id="${titleId}" style="font-family: 'Playfair Display', serif; font-size: 64px; color: #1a1a1a; margin: 0; padding: 0; text-align: center; width: 80%;">TITLE HERE</div>
                    <div id="${descId}" style="font-family: 'Montserrat', sans-serif; font-size: 24px; color: #666; text-transform: uppercase; letter-spacing: 0.1em; margin: 0; padding: 0; text-align: center; width: 80%;">Description here</div>
                </div>
            `.trim();
        default:
            return '';
    }
};
