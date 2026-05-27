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

        webviewView.webview.onDidReceiveMessage(data => {
            if (data.command === 'toggleTimer') {
                vscode.commands.executeCommand('devfocus.toggleTimer');
            } else if (data.command === 'openSettings') {
                vscode.commands.executeCommand('devfocus.openSettings');
            } else if (data.command === 'resetTimer') {
                vscode.commands.executeCommand('devfocus.resetTimer');
            } else if (data.command === 'startBreak') {
                vscode.commands.executeCommand('devfocus.startBreak');
            } else if (data.command === 'startFocus') {
                vscode.commands.executeCommand('devfocus.startFocus');
            }
        });
    }

    public updatePanel(phase: string, remaining: number, stats: any) {
        if (this._view) {
            this._view.webview.postMessage({ command: 'update', phase, remaining, stats });
        }
    }

    public updateHistory(history: any[]) {
        if (this._view) {
            this._view.webview.postMessage({ command: 'updateHistory', history });
        }
    }

    public showNotification(title: string, message: string, type: 'focus' | 'break', autoStarted: boolean) {
        if (this._view) {
            this._view.webview.postMessage({
                command: 'showNotification',
                title,
                message,
                type,
                autoStarted
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const tomatoUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'tomato.png'));

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Dev Focus</title>
            <style>
                :root {
                    --glow-purple: #D000FF;
                    --glow-green: #00FF19;
                    --glow-red: #FF0055;
                    --bg-dark: #120021;
                    --card-bg: #19002a;
                    --text-color: #f0f0f0;
                }

                body { 
                    font-family: var(--vscode-font-family); 
                    padding: 10px 15px; 
                    display: flex;
                    flex-direction: column;
                    background-color: var(--bg-dark);
                    color: var(--text-color);
                    overflow-x: hidden;
                }

                .logo-container {
                    text-align: center;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                .logo-img {
                    width: 50px;
                    height: 50px;
                    margin-bottom: 5px;
                    filter: drop-shadow(0 0 5px var(--glow-green));
                }
                .logo-text {
                    font-size: 14px;
                    font-weight: bold;
                    color: var(--text-color);
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    text-shadow: 0 0 8px var(--glow-purple), 0 0 15px var(--glow-purple);
                }

                .card { 
                    background: var(--card-bg);
                    border: 2px solid #333;
                    padding: 20px 15px; 
                    border-radius: 8px; 
                    text-align: center; 
                    margin-bottom: 20px;
                    box-shadow: 0 0 15px rgba(208, 0, 255, 0.2);
                    transition: box-shadow 0.3s;
                }
                .card:hover { box-shadow: 0 0 25px rgba(208, 0, 255, 0.4), 0 0 10px rgba(0, 255, 25, 0.2); }

                h2 { margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: var(--glow-green); }
                h1 { 
                    margin: 10px 0 20px 0; font-size: 48px; color: var(--text-color);
                    font-family: 'Courier New', Courier, monospace;
                    text-shadow: 0 0 10px var(--glow-green), 0 0 20px var(--glow-green), 0 0 30px rgba(0, 255, 25, 0.4);
                }

                button#toggleBtn {
                    background: transparent; color: var(--glow-green); border: 2px solid var(--glow-green);
                    padding: 12px 12px; border-radius: 4px; cursor: pointer; width: 100%;
                    font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;
                    transition: all 0.2s; box-shadow: 0 0 8px rgba(0, 255, 25, 0.4), inset 0 0 8px rgba(0, 255, 25, 0.2);
                }
                button#toggleBtn:hover { background: rgba(0, 255, 25, 0.1); box-shadow: 0 0 15px rgba(0, 255, 25, 0.6), inset 0 0 10px rgba(0, 255, 25, 0.3); }

                .action-buttons { display: flex; gap: 10px; margin-top: 15px; }
                button.secondary-btn { background: transparent; padding: 8px 12px; border-radius: 4px; cursor: pointer; width: 100%; font-size: 12px; text-transform: uppercase; transition: all 0.2s; }
                
                button#settingsBtn { color: var(--glow-purple); border: 1px solid var(--glow-purple); box-shadow: 0 0 5px rgba(208, 0, 255, 0.3); }
                button#settingsBtn:hover { background: rgba(208, 0, 255, 0.1); box-shadow: 0 0 12px rgba(208, 0, 255, 0.5), inset 0 0 8px rgba(208, 0, 255, 0.2); }
                
                button#resetBtn { color: var(--glow-red); border: 1px solid var(--glow-red); box-shadow: 0 0 5px rgba(255, 0, 85, 0.3); }
                button#resetBtn:hover { background: rgba(255, 0, 85, 0.1); box-shadow: 0 0 12px rgba(255, 0, 85, 0.5), inset 0 0 8px rgba(255, 0, 85, 0.2); }

                h3 { color: #fff; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 5px; margin-top: 25px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }

                #historyToggle { cursor: pointer; user-select: none; }
                #historyToggle:hover { color: var(--glow-purple); text-shadow: 0 0 5px rgba(208, 0, 255, 0.5); }

                .stat-box { margin-bottom: 8px; font-size: 14px; display: flex; justify-content: space-between; background: rgba(255, 255, 255, 0.03); padding: 4px 8px; border-radius: 4px; }
                .stat-label { color: rgba(255, 255, 255, 0.6); }
                .stat-value { font-weight: bold; color: var(--glow-green); text-shadow: 0 0 5px var(--glow-green); }

                .history-item { border-left: 3px solid #333; background: var(--card-bg); padding: 10px 12px; margin-bottom: 10px; border-radius: 0 4px 4px 0; font-size: 13px; transition: all 0.3s; }
                .history-item:hover { border-left: 3px solid var(--glow-purple); box-shadow: 0 0 10px rgba(208, 0, 255, 0.3); }
                .history-date { font-weight: bold; margin-bottom: 4px; color: var(--text-color); }
                .history-stats { display: flex; gap: 15px; opacity: 0.8; }

                /* === НЕОНОВЫЙ ОВЕРЛЕЙ УВЕДОМЛЕНИЙ === */
                #alert-overlay {
                    display: none;
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(18, 0, 33, 0.85); backdrop-filter: blur(4px);
                    z-index: 1000; justify-content: center; align-items: center;
                    opacity: 0; transition: opacity 0.3s ease;
                }
                #alert-overlay.show { display: flex; opacity: 1; }
                
                .alert-box {
                    background: var(--bg-dark);
                    border: 2px solid var(--glow-purple);
                    border-radius: 8px; padding: 25px 20px; width: 80%;
                    text-align: center;
                    box-shadow: 0 0 25px rgba(208, 0, 255, 0.5), inset 0 0 15px rgba(208, 0, 255, 0.2);
                    transform: scale(0.9); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                #alert-overlay.show .alert-box { transform: scale(1); }

                .alert-title {
                    color: var(--glow-green); font-size: 18px; font-weight: bold;
                    margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px;
                    text-shadow: 0 0 10px rgba(0, 255, 25, 0.6);
                }
                .alert-msg { font-size: 14px; color: var(--text-color); margin-bottom: 25px; opacity: 0.9; }

                .alert-buttons { display: flex; gap: 10px; flex-direction: column; }
                .alert-btn {
                    padding: 12px; border-radius: 4px; font-weight: bold; cursor: pointer;
                    text-transform: uppercase; font-size: 12px; letter-spacing: 1px; transition: all 0.2s;
                }
                .alert-btn-primary {
                    background: rgba(208, 0, 255, 0.2); color: var(--glow-purple);
                    border: 1px solid var(--glow-purple); box-shadow: 0 0 10px rgba(208, 0, 255, 0.3);
                }
                .alert-btn-primary:hover { background: rgba(208, 0, 255, 0.4); box-shadow: 0 0 15px rgba(208, 0, 255, 0.6); }
                
                .alert-btn-secondary { background: transparent; color: #888; border: 1px solid #555; }
                .alert-btn-secondary:hover { color: #fff; border-color: #888; }
            </style>
        </head>
        <body>
            <div class="logo-container">
                <img src="${tomatoUri}" class="logo-img" alt="Tomato Logo">
                <div class="logo-text">Dev Focus Pomodoro</div>
            </div>

            <div id="main-view">
                <div class="card">
                    <h2 id="phase">IDLE</h2>
                    <h1 id="timer">--:--</h1>
                    <button id="toggleBtn">START / PAUSE</button>
                    <div class="action-buttons">
                        <button id="resetBtn" class="secondary-btn">RESET</button>
                        <button id="settingsBtn" class="secondary-btn">SETTINGS</button>
                    </div>
                </div>
                
                <h3>TODAY'S STATS</h3>
                <div class="stat-box"><span class="stat-label">Lines:</span> <strong class="stat-value" id="lines">0</strong></div>
                <div class="stat-box"><span class="stat-label">Files:</span> <strong class="stat-value" id="files">0</strong></div>
                <div class="stat-box"><span class="stat-label">Top lang:</span> <strong class="stat-value" id="lang">unknown</strong></div>
                
                <h3 id="historyToggle">HISTORY <span id="historyChevron" style="float: right; font-size: 10px; margin-top: 4px;">▼</span></h3>
                <div id="history-container">Loading...</div>
            </div>

            <div id="alert-overlay">
                <div class="alert-box">
                    <div class="alert-title" id="alert-title">FOCUS COMPLETE</div>
                    <div class="alert-msg" id="alert-msg">Pomodoros today: 1</div>
                    <div class="alert-buttons">
                        <button class="alert-btn alert-btn-primary" id="alert-btn-action">START BREAK</button>
                        <button class="alert-btn alert-btn-secondary" id="alert-btn-close">LATER</button>
                    </div>
                </div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                let alertTimeout = null; 
                
                document.getElementById('toggleBtn').addEventListener('click', () => { vscode.postMessage({ command: 'toggleTimer' }); });
                document.getElementById('resetBtn').addEventListener('click', () => { vscode.postMessage({ command: 'resetTimer' }); });
                document.getElementById('settingsBtn').addEventListener('click', () => { vscode.postMessage({ command: 'openSettings' }); });

                let historyOpen = true;
                document.getElementById('historyToggle').addEventListener('click', () => {
                    historyOpen = !historyOpen;
                    document.getElementById('history-container').style.display = historyOpen ? 'block' : 'none';
                    document.getElementById('historyChevron').innerText = historyOpen ? '▼' : '▶';
                });

                const closeAlert = () => {
                    const overlay = document.getElementById('alert-overlay');
                    overlay.classList.remove('show');
                    setTimeout(() => overlay.style.display = 'none', 300);
                    
                    if (alertTimeout) {
                        clearTimeout(alertTimeout);
                        alertTimeout = null;
                    }
                };

                document.getElementById('alert-btn-close').addEventListener('click', closeAlert);

                document.getElementById('alert-btn-action').addEventListener('click', () => {
                    closeAlert();
                    const actionType = document.getElementById('alert-btn-action').getAttribute('data-action');
                    if (actionType === 'break') {
                        vscode.postMessage({ command: 'startBreak' });
                    } else {
                        vscode.postMessage({ command: 'startFocus' });
                    }
                });

                window.addEventListener('message', event => {
                    const message = event.data;
                    
                    if (message.command === 'showNotification') {
                        document.getElementById('alert-title').innerText = message.title;
                        document.getElementById('alert-msg').innerText = message.message;
                        
                        const actionBtn = document.getElementById('alert-btn-action');
                        const closeBtn = document.getElementById('alert-btn-close');

                        if (message.type === 'focus') {
                            actionBtn.innerText = 'START BREAK';
                            actionBtn.setAttribute('data-action', 'break');
                            actionBtn.style.display = message.autoStarted ? 'none' : 'block';
                            closeBtn.innerText = message.autoStarted ? 'OK' : 'LATER';
                        } else {
                            actionBtn.innerText = 'START FOCUS';
                            actionBtn.setAttribute('data-action', 'focus');
                            actionBtn.style.display = 'block';
                            closeBtn.innerText = 'LATER';
                        }

                        const overlay = document.getElementById('alert-overlay');
                        overlay.style.display = 'flex';
                        setTimeout(() => overlay.classList.add('show'), 10);

                        if (alertTimeout) {
                            clearTimeout(alertTimeout);
                        }
                        alertTimeout = setTimeout(() => {
                            closeAlert();
                        }, 7000);
                    }

                    if (message.command === 'update') {
                        document.getElementById('phase').innerText = message.phase.toUpperCase();
                        const m = Math.floor(message.remaining / 60).toString().padStart(2, '0');
                        const s = (message.remaining % 60).toString().padStart(2, '0');
                        document.getElementById('timer').innerText = m + ':' + s;
                        document.getElementById('lines').innerText = message.stats.linesAdded;
                        document.getElementById('files').innerText = message.stats.filesOpened;
                        document.getElementById('lang').innerText = message.stats.topLanguage;
                    }
                    
                    if (message.command === 'updateHistory') {
                        const container = document.getElementById('history-container');
                        if (!message.history || message.history.length === 0) {
                            container.innerHTML = '<em>History is empty for now</em>';
                            return;
                        }
                        
                        let html = '';
                        message.history.forEach(h => {
                            html += \`
                                <div class="history-item">
                                    <div class="history-date">\${h.date}</div>
                                    <div class="history-stats">
                                        <span>🍅 \${h.pomodoros}</span>
                                        <span> Lines: \${h.linesAdded}</span>
                                        <span> Language: \${h.topLanguage}</span>
                                    </div>
                                </div>
                            \`;
                        });
                        container.innerHTML = html;
                    }
                });
            </script>
        </body>
        </html>`;
    }
}