import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        watch: {
            // ネットワークドライブや一部の環境での検知漏れを防ぐためにポーリングを使用
            usePolling: true,
            interval: 100,
        },
        // クライアントに送るHMR設定
        hmr: {
            overlay: true,
        }
    },
    plugins: [
        {
            name: 'watch-all-html',
            // すべてのHTMLファイルの変更を監視し、変更があればフルリロードを指示する
            configureServer(server) {
                server.watcher.add('**/*.html'); // フォルダ内の全HTMLを監視対象に強制追加
                server.watcher.on('change', (file) => {
                    if (file.endsWith('.html')) {
                        console.log(`HTML changed: ${file} - Triggering full reload...`);
                        server.ws.send({
                            type: 'full-reload',
                            path: '*'
                        });
                    }
                });
            },
        }
    ],
});
