/**
 * Design Editor - Core Logic (Smart Sync Edition)
 */

// Global state
let fileHandle: FileSystemFileHandle | null = null;
let isModified = false;

const designArea = document.getElementById('design-area') as HTMLDivElement;
const btnOpen = document.getElementById('btn-open') as HTMLButtonElement;
const btnSaveAs = document.getElementById('btn-save-as') as HTMLButtonElement;
const btnSave = document.getElementById('btn-save') as HTMLButtonElement;
const btnReload = document.getElementById('btn-reload') as HTMLButtonElement;
const currentFileNameDisplay = document.getElementById('current-filename') as HTMLSpanElement;
const statusIndicator = document.getElementById('save-status-indicator') as HTMLSpanElement;

/**
 * 通知（トースト）の表示
 */
function showToast(message: string, duration = 3000) {
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
    pointer-events: none;
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
  if (!document.querySelector('style#toast-style')) {
    style.id = 'toast-style';
    document.head.appendChild(style);
  }

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s ease-out';
    setTimeout(() => toast.remove(), 500);
  }, duration);
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
    const lastFile = localStorage.getItem('lastOpenedFile');
    currentFileNameDisplay.textContent = lastFile ? `${lastFile} (Sync Mode 📡)` : '新規ドキュメント';
    btnSave.disabled = true;
    btnSave.title = '保存するには再度「開く」か「保存」してください';
  }

  statusIndicator.className = isModified ? 'indicator modified' : 'indicator';
}

/**
 * 最新のデザインをサーバーから取得
 */
async function fetchLatestDesign(fileName: string) {
  try {
    // まず design/ フォルダ内を試行し、なければルートを確認
    let response = await fetch(`/design/${fileName}?t=${Date.now()}`);
    if (!response.ok) {
      response = await fetch(`/${fileName}?t=${Date.now()}`);
    }

    if (response.ok) {
      const content = await response.text();
      designArea.innerHTML = content;
      isModified = false;
      updateUI();
      showToast(`${fileName} を同期しました`, 2000);
    }
  } catch (err) {
    console.error('Fetch failed:', err);
  }
}

/**
 * ファイルを保存内容から読み直す
 */
async function handleReload() {
  const lastFileName = localStorage.getItem('lastOpenedFile');
  if (fileHandle) {
    try {
      const file = await fileHandle.getFile();
      designArea.innerHTML = await file.text();
      isModified = false;
      updateUI();
      showToast('ファイルを保存内容から読み直しました');
    } catch (err) {
      console.error('Reload from file failed:', err);
    }
  } else if (lastFileName) {
    await fetchLatestDesign(lastFileName);
  } else {
    showToast('読み直すファイルがありません');
  }
}

/**
 * ファイル操作
 */
async function handleOpen() {
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [{ description: 'HTML Files', accept: { 'text/html': ['.html'] } }],
      multiple: false,
    });
    fileHandle = handle;
    localStorage.setItem('lastOpenedFile', handle.name);
    const file = await fileHandle.getFile();
    designArea.innerHTML = await file.text();
    isModified = false;
    updateUI();
    showToast('ファイルを開きました');
  } catch (err) { /* ignore */ }
}

async function handleSaveAs() {
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: localStorage.getItem('lastOpenedFile') || 'design.html',
      types: [{ description: 'HTML Files', accept: { 'text/html': ['.html'] } }],
    });
    fileHandle = handle;
    localStorage.setItem('lastOpenedFile', handle.name);
    await saveToFile();
    updateUI();
    showToast('保存しました');
  } catch (err) { /* ignore */ }
}

async function handleSave() {
  if (!fileHandle) return;
  try {
    await saveToFile();
    updateUI();
    showToast('上書き保存しました');
  } catch (err) {
    alert('保存に失敗しました。アクセス許可を確認してください。');
  }
}

async function saveToFile() {
  if (!fileHandle) return;
  const writable = await fileHandle.createWritable();
  await writable.write(designArea.innerHTML);
  await writable.close();
  isModified = false;
}

// Event Listeners
btnOpen.addEventListener('click', handleOpen);
btnSaveAs.addEventListener('click', handleSaveAs);
btnSave.addEventListener('click', handleSave);
btnReload.addEventListener('click', handleReload);

designArea.contentEditable = "true";

// Shortcuts
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key.toLowerCase() === 's') { e.preventDefault(); handleSave(); }
    if (e.key.toLowerCase() === 'o') { e.preventDefault(); handleOpen(); }
    if (e.key.toLowerCase() === 'r') { e.preventDefault(); handleReload(); }
  }
});

// Watch changes
new MutationObserver(() => {
  if (!isModified) { isModified = true; updateUI(); }
}).observe(designArea, { childList: true, subtree: true, characterData: true });

// Zoom
const selectZoom = document.getElementById('select-zoom') as HTMLSelectElement;
selectZoom.addEventListener('change', () => {
  designArea.style.transform = `scale(${selectZoom.value})`;
});

// Vite Smart Sync リスナー
if ((import.meta as any).hot) {
  (import.meta as any).hot.on('design-update', (data: { fileName: string }) => {
    const lastOpenedFile = localStorage.getItem('lastOpenedFile');
    if (data.fileName === lastOpenedFile) {
      fetchLatestDesign(data.fileName);
    }
  });
}

// Initial session restore
const lastFileMemory = localStorage.getItem('lastOpenedFile');
if (lastFileMemory) {
  fetchLatestDesign(lastFileMemory);
} else {
  updateUI();
}
