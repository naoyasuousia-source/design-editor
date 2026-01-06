/**
 * デザイン要素の操作（追加、削除、グループ化、スタイル適用）を担当するサービス層
 */
export const elementService = {
    /**
     * 要素を削除する
     */
    deleteElements(targets: HTMLElement[]): void {
        targets.forEach(el => el.remove());
    },

    /**
     * 要素を複製する
     */
    duplicateElements(targets: HTMLElement[], container: HTMLElement): string | null {
        if (targets.length === 0) return null;

        const isGroupDuplication = targets.length > 1 || (targets.length === 1 && targets[0].hasAttribute('data-group-id'));
        const newGroupId = isGroupDuplication
            ? `group-${Math.random().toString(36).substring(2, 11)}`
            : null;

        let firstCloneId: string | null = null;

        targets.forEach((el, index) => {
            const clone = el.cloneNode(true) as HTMLElement;
            const newId = `el-${Math.random().toString(36).substring(2, 11)}`;
            clone.id = newId;
            if (index === 0) firstCloneId = newId;

            if (newGroupId) {
                clone.setAttribute('data-group-id', newGroupId);
            } else {
                clone.removeAttribute('data-group-id');
            }

            // 位置を少しずらす (20px)
            const top = parseFloat(el.style.top || '0');
            const left = parseFloat(el.style.left || '0');
            clone.style.top = `${top + 20}px`;
            clone.style.left = `${left + 20}px`;

            container.appendChild(clone);
        });

        return firstCloneId;
    },

    /**
     * 要素をグループ化する
     */
    groupElements(targets: HTMLElement[]): string | null {
        if (targets.length === 0) return null;
        const id = `group-${Math.random().toString(36).substring(2, 11)}`;
        targets.forEach(el => el.setAttribute('data-group-id', id));
        return id;
    },

    /**
     * グループ化を解除する
     */
    ungroupElements(targets: HTMLElement[]): void {
        targets.forEach(el => el.removeAttribute('data-group-id'));
    },

    /**
     * スタイルを適用する
     */
    applyStyle(targets: HTMLElement[], property: string, value: string): void {
        targets.forEach(el => {
            // @ts-ignore
            el.style[property] = value;
        });
    }
};
