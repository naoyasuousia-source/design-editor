import React from 'react';
import { Group, Ungroup, Trash2, Copy } from 'lucide-react';

interface GroupActionsProps {
    isGrouped: boolean;
    canGroup: boolean;
    onGroup: () => void;
    onUngroup: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
}

const GroupActions: React.FC<GroupActionsProps> = ({
    isGrouped,
    canGroup,
    onGroup,
    onUngroup,
    onDelete,
    onDuplicate
}) => {
    if (canGroup) {
        return (
            <div className="flex items-center gap-1 p-1">
                <button
                    className="p-1.5 hover:bg-blue-500/20 rounded text-blue-400 hover:text-blue-300 transition-all flex items-center gap-1"
                    onClick={onGroup}
                    title="Group All"
                >
                    <Group size={14} />
                    <span className="text-xs font-bold">グループ化</span>
                </button>
                <button
                    className="p-1.5 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-all flex items-center gap-1"
                    onClick={onDelete}
                    title="Delete All"
                >
                    <Trash2 size={14} />
                    <span className="text-xs font-bold">削除</span>
                </button>
            </div>
        );
    }

    if (isGrouped) {
        return (
            <div className="flex items-center gap-1 p-1">
                <button
                    className="p-1.5 hover:bg-orange-500/20 rounded text-orange-400 hover:text-orange-300 transition-all flex items-center gap-1"
                    onClick={onUngroup}
                    title="Ungroup"
                >
                    <Ungroup size={14} />
                    <span className="text-xs font-bold">解除</span>
                </button>
                <button
                    className="p-1.5 hover:bg-orange-500/20 rounded text-orange-400 hover:text-orange-300 transition-all flex items-center gap-1"
                    onClick={onDuplicate}
                    title="Duplicate Group"
                >
                    <Copy size={14} />
                    <span className="text-xs font-bold">複製</span>
                </button>
                <button
                    className="p-1.5 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-all flex items-center gap-1"
                    onClick={onDelete}
                    title="Delete Group"
                >
                    <Trash2 size={14} />
                    <span className="text-xs font-bold">全削除</span>
                </button>
            </div>
        );
    }

    return null;
};

export default GroupActions;
