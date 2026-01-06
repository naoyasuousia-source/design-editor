import React from 'react';
import { cn } from '@/utils/cn';

interface NavButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
    children?: React.ReactNode;
}

const NavButton: React.FC<NavButtonProps> = ({
    icon,
    label,
    onClick,
    className,
    disabled,
    children
}) => (
    <div className="relative flex flex-col items-center">
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200",
                "text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                className
            )}
        >
            <span className="w-4 h-4">{icon}</span>
            <span className="whitespace-nowrap">{label}</span>
        </button>
        {children}
    </div>
);

export default NavButton;
