import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    base: './',
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        watch: {
            usePolling: true,
            interval: 100,
        },
    },
    plugins: [
        react(),
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
