import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    server: {
        watch: {
            usePolling: true,
            interval: 100,
        },
    },
    plugins: [
        {
            name: 'smart-html-sync',
            configureServer(server) {
                // HTMLの変更を監視するが、フルリロードは指示しない
                server.watcher.add('**/*.html');
                server.watcher.on('change', (file) => {
                    if (file.endsWith('.html')) {
                        const fileName = file.split(/[\\/]/).pop();
                        console.log(`Smart Sync: ${fileName} changed. Sending update signal...`);
                        // カスタムイベントをブラウザに送信（フルリロードはさせない）
                        server.ws.send('design-update', { fileName });
                    }
                });
            },
        }
    ],
});
