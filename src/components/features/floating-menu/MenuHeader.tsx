import React from 'react';
import { Group, Hash, Copy } from 'lucide-react';

interface MenuHeaderProps {
    id?: string;
    groupId?: string | null;
    isGrouped: boolean;
    canGroup: boolean;
    onCopyId: () => void;
    onCopyGroupId: () => void;
}

const MenuHeader: React.FC<MenuHeaderProps> = ({
    id,
    groupId,
    isGrouped,
    canGroup,
    onCopyId,
    onCopyGroupId
}) => {
    if (isGrouped) {
        return (
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-orange-500/30 bg-orange-500/10 rounded-t-md">
                <div className="flex items-center gap-1.5 overflow-hidden">
                    <Group size={12} className="text-orange-400" />
                    <span className="text-[10px] font-mono text-orange-300 truncate">
                        Group: {groupId}
                    </span>
                </div>
                <button
                    onClick={onCopyGroupId}
                    className="p-1 hover:bg-orange-500/20 rounded text-orange-400 hover:text-orange-200 transition-all"
                    title="Copy Group ID"
                >
                    <Copy size={10} />
                </button>
            </div>
        );
    }

    if (canGroup) {
        return (
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-blue-500/30 bg-blue-500/10 rounded-t-md">
                <div className="flex items-center gap-1.5 overflow-hidden">
                    <Group size={12} className="text-blue-400" />
                    <span className="text-[10px] font-bold text-blue-300 truncate">
                        複数要素選択中
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between px-2 py-1 border-b border-white/5 bg-white/5 rounded-t-md">
            <div className="flex items-center gap-1.5 overflow-hidden">
                <Hash size={10} className="text-gray-500" />
                <span className="text-[10px] font-mono text-gray-400 truncate">
                    {id || 'no-id'}
                </span>
            </div>
            {id && (
                <button onClick={onCopyId} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-all">
                    <Copy size={10} />
                </button>
            )}
        </div>
    );
};

export default MenuHeader;
