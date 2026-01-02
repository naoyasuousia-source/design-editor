import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SaveToastProps {
    message: string;
    duration?: number;
    onClose: () => void;
}

/**
 * 一時的な保存成功メッセージを表示するトースト
 */
const SaveToast: React.FC<SaveToastProps> = ({ message, duration = 1000, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // マウント直後にフェードイン
        requestAnimationFrame(() => {
            setIsVisible(true);
        });

        // 指定時間後にフェードアウトしてから閉じる
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 200); // フェードアウトアニメーション完了後に閉じる
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className="fixed inset-x-0 top-0 flex items-start justify-center z-[100] pointer-events-none pt-2">
            <div
                className={cn(
                    "bg-green-500/95 text-white px-6 py-4 rounded-lg shadow-2xl",
                    "flex items-center gap-3 border border-green-400/20",
                    "transition-all duration-200",
                    isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
                )}
            >
                <Check className="w-5 h-5 text-green-100" />
                <span className="font-medium text-sm">{message}</span>
            </div>
        </div>
    );
};

export default SaveToast;
