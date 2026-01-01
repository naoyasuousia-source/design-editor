import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind のクラスを結合し、競合を解決するためのユーティリティ
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
