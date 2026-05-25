import * as vscode from 'vscode';

export class SidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'devfocus.panel';
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Слушаем сообщения из Webview (например, клик по кнопке в UI)
        webviewView.webview.onDidReceiveMessage(data => {
            if (data.command === 'toggleTimer') {
                vscode.commands.executeCommand('devfocus.toggleTimer');
            }
        });
    }

    // Этот метод будем вызывать каждую секунду для обновления цифр
    public updatePanel(phase: string, remaining: number, stats: any) {
        if (this._view) {
            this._view.webview.postMessage({
                command: 'update',
                phase,
                remaining,
                stats
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Dev Focus</title>
            <style>
                body { font-family: var(--vscode-font-family); padding: 15px; }
                .stat-box { margin-bottom: 8px; font-size: 14px; }
                .card { background: var(--vscode-editor-inactiveSelectionBackground); padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;}
                h2 { margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: var(--vscode-descriptionForeground); }
                h1 { margin: 10px 0; font-size: 36px; }
                button {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    width: 100%;
                    font-weight: bold;
                }
                button:hover { background: var(--vscode-button-hoverBackground); }
                hr { border: none; border-top: 1px solid var(--vscode-panel-border); margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="card">
                <h2 id="phase">Ожидание</h2>
                <h1 id="timer">--:--</h1>
                <button id="toggleBtn">Старт / Пауза</button>
            </div>
            
            <h3>Статистика Сегодня</h3>
            <div class="stat-box">📝 Строк: <strong id="lines">0</strong></div>
            <div class="stat-box">📄 Файлов: <strong id="files">0</strong></div>
            <div class="stat-box">💻 Топ язык: <strong id="lang">unknown</strong></div>

            <script>
                const vscode = acquireVsCodeApi();
                
                // Отправляем команду в расширение при клике
                document.getElementById('toggleBtn').addEventListener('click', () => {
                    vscode.postMessage({ command: 'toggleTimer' });
                });

                // Принимаем данные от расширения и обновляем DOM
                window.addEventListener('message', event => {
                    const message = event.data;
                    if (message.command === 'update') {
                        document.getElementById('phase').innerText = message.phase;
                        
                        const m = Math.floor(message.remaining / 60).toString().padStart(2, '0');
                        const s = (message.remaining % 60).toString().padStart(2, '0');
                        document.getElementById('timer').innerText = m + ':' + s;
                        
                        document.getElementById('lines').innerText = message.stats.linesAdded;
                        document.getElementById('files').innerText = message.stats.filesOpened;
                        document.getElementById('lang').innerText = message.stats.topLanguage;
                    }
                });
            </script>
        </body>
        </html>`;
    }
}