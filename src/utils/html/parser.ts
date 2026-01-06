import { type MetaMessage, PAGE_SIZES } from '@/types/editor';
import { sanitizeStyles } from './sanitizer';

/**
 * HTML からメタメッセージ（JSON）を抽出する
 */
export const parseMetaMessage = (html: string): MetaMessage | null => {
    try {
        let meta: MetaMessage = {
            fixedRules: '',
            collaborativeRules: '',
            designConcept: '',
            colors: {
                main: 'none',
                sub: 'none',
                accent: 'none',
            },
            colorKit: 'custom'
        };

        const fixedMatch = html.match(/<!-- FIXED_RULES_START -->([\s\S]*?)<!-- FIXED_RULES_END -->/);
        if (fixedMatch && fixedMatch[1]) {
            meta.fixedRules = fixedMatch[1].trim();
        }

        const matches = Array.from(html.matchAll(/<!-- USER_REQUIREMENT_START -->([\s\S]*?)<!-- USER_REQUIREMENT_END -->/g));

        for (let i = matches.length - 1; i >= 0; i--) {
            const content = matches[i][1].trim();
            try {
                const json = JSON.parse(content);
                if (json.requirements && !json.collaborativeRules) json.collaborativeRules = json.requirements;
                if (json.concept && !json.designConcept) json.designConcept = json.concept;
                if (json.colors && json.colors.primary) {
                    json.colors.main = json.colors.primary;
                    json.colors.sub = json.colors.secondary;
                }
                if (Array.isArray(json.fixedRules)) json.fixedRules = json.fixedRules.join('\n');
                if (Array.isArray(json.collaborativeRules)) json.collaborativeRules = json.collaborativeRules.join('\n');

                return { ...meta, ...json };
            } catch (e) {
                continue;
            }
        }

        const scriptMatch = html.match(/<script id="ai-link-metadata" type="application\/json">([\s\S]*?)<\/script>/);
        if (scriptMatch && scriptMatch[1]) {
            let jsonText = scriptMatch[1].trim();
            jsonText = jsonText.replace(/<!-- USER_REQUIREMENT_START -->/g, '');
            jsonText = jsonText.replace(/<!-- USER_REQUIREMENT_END -->/g, '');
            const json = JSON.parse(jsonText.trim());
            return { ...meta, ...json };
        }
    } catch (e) {
        console.error('Failed to parse meta message from HTML:', e);
    }
    return null;
};

export const extractCustomCss = (_html: string): string => {
    return '';
};
