import type { PageSize } from '../types/editor';

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
                <div id="${id}" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80%; text-align: center; border: 2px solid #1a1a1a; padding: 40px;">
                    <h1 id="${titleId}" style="font-family: 'Playfair Display', serif; font-size: 40px; color: #1a1a1a; margin-bottom: 10px;">New Post</h1>
                    <p id="${descId}" style="font-family: 'Montserrat', sans-serif; font-size: 14px; color: #999; text-transform: uppercase; letter-spacing: 0.2em;">Social Media Template</p>
                </div>
            `.trim();
        default:
            return '';
    }
};
