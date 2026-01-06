/**
 * HTML 文字列のパースや DOM 操作を担当するサービス層
 */
import { PAGE_SIZES } from '@/types/editor';
import { parseMetaMessage } from '@/utils/html/parser';
import { sanitizeStyles } from '@/utils/html/sanitizer';

export const htmlService = {
    /**
     * 文字列を一時的な DOM にパースする
     */
    parseHTML(html: string): HTMLElement {
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div id="__root__">${html}</div>`, 'text/html');
        return doc.getElementById('__root__') as HTMLElement;
    },

    /**
     * デザイン領域の HTML を抽出する (DOMParserを使用するためService層)
     */
    extractDesignContent(html: string): string {
        const matches = Array.from(html.matchAll(/<!-- DESIGN_START -->([\s\S]*?)<!-- DESIGN_END -->/g));

        let content = html;
        if (matches.length > 0) {
            content = matches[matches.length - 1][1].trim();
        }

        if (!content) return "";

        if (matches.length === 0 && (content.toLowerCase().includes('<body') || content.toLowerCase().includes('<html'))) {
            const bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
            if (bodyMatch) content = bodyMatch[1].trim();
        }

        try {
            const root = this.parseHTML(content);
            if (root) {
                const surface = root.querySelector('.DesignSurface');
                const target = (surface || root) as HTMLElement;

                const meta = parseMetaMessage(html);
                const pageSize = meta?.pageSize || 'SQUARE';
                const config = PAGE_SIZES[pageSize];

                Array.from(target.children).forEach(el => {
                    const element = el as HTMLElement;
                    const style = element.getAttribute('style');
                    if (style) {
                        element.setAttribute('style', sanitizeStyles(style, config.width, config.height));
                    }
                });

                if (surface) return surface.innerHTML.trim();
            }
        } catch (e) {
            console.warn('extractDesignContent: DOMParser failed, using fallback', e);
        }

        const surfaceMatch = content.match(/^<div[^>]*class="[^"]*DesignSurface[^"]*"[^>]*>([\s\S]*)<\/div>$/i);
        if (surfaceMatch) return surfaceMatch[1].trim();

        return content;
    },

    /**
     * デザインサーフェスのクリーンな HTML を生成する
     */
    getCleanHTML(surface: HTMLElement, imageUrls: Record<string, string>): string {
        const { restoreRelativePaths } = require('@/utils/html/cleaner');
        const clone = surface.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('[contenteditable]').forEach(el => {
            el.removeAttribute('contenteditable');
        });
        // エディタ専用の選択中クラスを除去して保存する
        clone.querySelectorAll('.moveable-target-active').forEach(el => {
            el.classList.remove('moveable-target-active');
        });

        // Blob URL を相対パスに戻す
        return restoreRelativePaths(clone.innerHTML, imageUrls);
    }
};
