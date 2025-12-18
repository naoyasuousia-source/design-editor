/**
 * Design Editor - Core Logic
 * Handles File System Access API and UI Synchronization
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
 * UIの更新
 */
function updateUI() {
  if (fileHandle) {
    currentFileNameDisplay.textContent = fileHandle.name;
    btnSave.disabled = false;
    btnSave.title = '現在のファイルに保存';
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
    
    // デザイン領域に展開
    designArea.innerHTML = content;
    
    isModified = false;
    updateUI();
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      console.error('File opening failed:', err);
      alert('ファイルを開くことができませんでした。');
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
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      console.error('Save as failed:', err);
      alert('保存に失敗しました。');
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

// デザイン領域の変更検知 (AntigravityによるinnerHTML操作やユーザーの編集)
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

// 初期化
updateUI();

// 開発用: Antigravityがグローバルからアクセスできるようにする
(window as any).designEditor = {
  getHTML: () => designArea.innerHTML,
  setHTML: (html: string) => {
    designArea.innerHTML = html;
  },
  designArea
};
