/**
 * エディタ専用の属性や要素を除去してクリーンな HTML にする
 */
export const cleanHTML = (html: string): string => {
    let cleaned = html;
    // contentEditable 属性の除去
    cleaned = cleaned.replace(/\scontenteditable="[^"]*"/g, '');
    // spellcheck 属性の除去
    cleaned = cleaned.replace(/\sspellcheck="[^"]*"/g, '');
    // エディタ用の一時的な data 属性を除去 (data-group-id は維持)
    cleaned = cleaned.replace(/\sdata-(?!group-id|group-type)[a-zA-Z0-9-]+="[^"]*"/g, '');
    // デザイン領域のクラスをクリーンアップ
    cleaned = cleaned.replace(/class="[^"]*DesignSurface[^"]*"/g, 'class="DesignSurface"');
    // デザイン領域のスタイルをリセット (固定サイズは CSS 側で制御するため 100% 指定を消去)
    cleaned = cleaned.replace(/style="[^"]*DesignSurface[^"]*"/g, 'style="position: relative; overflow: hidden;"');
    // 空の style 属性の除去
    cleaned = cleaned.replace(/\sstyle=""/g, '');
    return cleaned.trim();
};
