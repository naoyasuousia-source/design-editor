/**
 * Design Editor - Core Logic (Enhanced)
 * Handles File System Access API, UI Synchronization, and Shortcuts
 */

// Global state
let fileHandle: FileSystemFileHandle | null = null;
let isModified = false;

const designArea = document.getElementById('design-area') as HTMLDivElement;
const btnOpen = document.getElementById('btn-open') as HTMLButtonElement;
const btnSaveAs = document.getElementById('btn-save-as') as HTMLButtonElement;
const btnSave = document.getElementById('btn-save') as HTMLButtonElement;
const currentFileNameDisplay = document.getElementById('current-filename') as HTMLSpanElement;
const statusIndicator = document.getElementById('save-status-indicator') as HTMLSpanElement;

/**
 * 通知（トースト）の表示
 */
function showToast(message: string) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 48px;
    right: 24px;
    background: #4f46e5;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
    z-index: 1000;
    font-size: 0.875rem;
    font-weight: 500;
    animation: slideIn 0.3s ease-out forwards;
  `;
  document.body.appendChild(toast);

  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s ease-out';
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

/**
 * UIの更新
 */
function updateUI() {
  if (fileHandle) {
    currentFileNameDisplay.textContent = fileHandle.name;
    btnSave.disabled = false;
    btnSave.title = '現在のファイルに保存 (Ctrl+S)';
  } else {
    currentFileNameDisplay.textContent = '新規ドキュメント';
    btnSave.disabled = true;
    btnSave.title = 'ファイルが開かれていません';
  }

  if (isModified) {
    statusIndicator.className = 'indicator modified';
  } else {
    statusIndicator.className = 'indicator';
  }
}

/**
 * ファイルを開く
 */
async function handleOpen() {
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: 'HTML Files',
          accept: { 'text/html': ['.html'] },
        },
      ],
      multiple: false,
    });

    fileHandle = handle;
    const file = await fileHandle.getFile();
    const content = await file.text();

    designArea.innerHTML = content;
    isModified = false;
    updateUI();
    showToast('ファイルを開きました');
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      console.error('File opening failed:', err);
    }
  }
}

/**
 * 名前を付けて保存
 */
async function handleSaveAs() {
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: 'design.html',
      types: [
        {
          description: 'HTML Files',
          accept: { 'text/html': ['.html'] },
        },
      ],
    });

    fileHandle = handle;
    await saveToFile();
    updateUI();
    showToast('名前を付けて保存しました');
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      console.error('Save as failed:', err);
    }
  }
}

/**
 * 上書き保存
 */
async function handleSave() {
  if (!fileHandle) return;
  try {
    await saveToFile();
    updateUI();
    showToast('上書き保存しました');
  } catch (err) {
    console.error('Save failed:', err);
    alert('上書き保存に失敗しました。ブラウザのアクセス許可を確認してください。');
  }
}

/**
 * 共通の保存処理
 */
async function saveToFile() {
  if (!fileHandle) return;
  const writable = await fileHandle.createWritable();
  const content = designArea.innerHTML;
  await writable.write(content);
  await writable.close();
  isModified = false;
}

// Event Listeners
btnOpen.addEventListener('click', handleOpen);
btnSaveAs.addEventListener('click', handleSaveAs);
btnSave.addEventListener('click', handleSave);

// デザイン領域の直接編集を有効化（テキストの微調整用）
designArea.contentEditable = "true";

// キーボードショートカット
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      case 's':
        e.preventDefault();
        if (fileHandle) handleSave();
        else handleSaveAs();
        break;
      case 'o':
        e.preventDefault();
        handleOpen();
        break;
    }
  }
});

// デザイン領域の変更検知
const observer = new MutationObserver(() => {
  if (!isModified) {
    isModified = true;
    updateUI();
  }
});

observer.observe(designArea, {
  childList: true,
  subtree: true,
  characterData: true,
});

updateUI();

// グローバルインターフェース
(window as any).designEditor = {
  getHTML: () => designArea.innerHTML,
  setHTML: (html: string) => {
    designArea.innerHTML = html;
  },
  designArea
};
