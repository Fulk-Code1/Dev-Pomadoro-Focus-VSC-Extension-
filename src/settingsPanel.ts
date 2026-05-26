import * as vscode from 'vscode';

export function openSettingsPanel(context: vscode.ExtensionContext, onSettingsChanged: () => void) {
    const panel = vscode.window.createWebviewPanel(
        'devFocusSettings',
        'Dev Focus Настройки',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );

    const currentSettings = context.globalState.get('devfocus.settings', {
        preset: '25/5',
        customFocusMin: 25,
        customBreakMin: 5,
        doNotDisturb: true,
        autoStartBreak: true
    });

    panel.webview.html = getSettingsHtml(currentSettings);

    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case 'saveSettings':
                    context.globalState.update('devfocus.settings', message.settings);
                    vscode.window.showInformationMessage('Настройки Dev Focus сохранены!');
                    onSettingsChanged();
                    panel.dispose();
                    return;
            }
        },
        undefined,
        context.subscriptions
    );
}

function getSettingsHtml(settings: any) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            :root {
                --glow-purple: #D000FF;
                --glow-green: #00FF19;
                --bg-dark: #120021;
                --card-bg: #19002a;
                --input-bg: #0d0018;
                --text-color: #f0f0f0;
            }

            body { 
                font-family: var(--vscode-font-family); 
                padding: 15px 20px; 
                max-width: 500px; 
                background-color: var(--bg-dark); 
                color: var(--text-color);
                box-sizing: border-box;
            }

            h2 { 
                color: var(--text-color);
                text-transform: uppercase;
                letter-spacing: 2px;
                text-shadow: 0 0 10px var(--glow-purple), 0 0 20px var(--glow-purple);
                margin-top: 0;
                margin-bottom: 15px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                padding-bottom: 8px;
                font-size: 16px;
            }

            .form-group { margin-bottom: 12px; }

            label { 
                display: block; 
                margin-bottom: 4px; 
                font-weight: bold; 
                font-size: 11px;
                text-transform: uppercase;
                color: var(--glow-green);
                text-shadow: 0 0 5px rgba(0, 255, 25, 0.3);
            }

            /* Сжимаем поля ввода */
            select, input[type="number"] { 
                background: var(--input-bg); 
                color: var(--text-color); 
                border: 1px solid #333; 
                padding: 6px 10px; 
                width: 100%; 
                border-radius: 4px;
                font-size: 13px;
                outline: none;
                transition: all 0.3s;
                box-shadow: inset 0 0 5px rgba(0,0,0,0.5);
                box-sizing: border-box;
            }

            select:focus, input[type="number"]:focus { 
                border-color: var(--glow-green);
                box-shadow: 0 0 10px rgba(0, 255, 25, 0.4), inset 0 0 5px rgba(0, 255, 25, 0.1);
            }

            .checkbox-group { 
                display: flex; 
                align-items: center; 
                cursor: pointer;
                user-select: none;
                margin-top: 5px;
            }

            .checkbox-group input { 
                width: 16px; 
                height: 16px; 
                margin-right: 10px; 
                cursor: pointer;
                accent-color: var(--glow-purple);
            }

            .checkbox-label {
                font-size: 13px;
                color: var(--text-color);
                text-transform: none;
                text-shadow: none;
                margin-bottom: 0;
            }

            /* Кнопка сохранить тоже стала компактнее */
            button#saveBtn {
                background: transparent;
                color: var(--glow-purple);
                border: 2px solid var(--glow-purple);
                padding: 10px 20px;
                cursor: pointer;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 2px;
                margin-top: 15px;
                border-radius: 4px;
                width: 100%;
                font-size: 12px;
                transition: all 0.2s;
                box-shadow: 0 0 10px rgba(208, 0, 255, 0.2);
            }

            button#saveBtn:hover { 
                background: rgba(208, 0, 255, 0.1);
                box-shadow: 0 0 20px rgba(208, 0, 255, 0.5), inset 0 0 10px rgba(208, 0, 255, 0.2);
                transform: translateY(-1px);
            }

            button#saveBtn:active {
                transform: translateY(1px);
            }

            #custom-fields {
                padding: 10px 15px;
                background: rgba(255, 255, 255, 0.03);
                border-radius: 8px;
                border-left: 2px solid var(--glow-purple);
                margin-top: -5px;
                margin-bottom: 12px;
            }
        </style>
    </head>
    <body>
        <h2>Настройки системы</h2>
        
        <div class="form-group">
            <label>Протокол времени (Пресет)</label>
            <select id="preset">
                <option value="25/5" ${settings.preset === '25/5' ? 'selected' : ''}>25 фокус / 5 перерыв</option>
                <option value="50/10" ${settings.preset === '50/10' ? 'selected' : ''}>50 фокус / 10 перерыв</option>
                <option value="90/20" ${settings.preset === '90/20' ? 'selected' : ''}>90 фокус / 20 перерыв</option>
                <option value="custom" ${settings.preset === 'custom' ? 'selected' : ''}>Пользовательский режим</option>
            </select>
        </div>

        <div id="custom-fields" style="display: ${settings.preset === 'custom' ? 'block' : 'none'};">
            <div class="form-group">
                <label>Минуты фокуса</label>
                <input type="number" id="focusMin" value="${settings.customFocusMin}" min="1" max="180">
            </div>
            <div class="form-group">
                <label>Минуты перерыва</label>
                <input type="number" id="breakMin" value="${settings.customBreakMin}" min="1" max="60">
            </div>
        </div>

        <div class="form-group checkbox-group">
            <input type="checkbox" id="dnd" ${settings.doNotDisturb ? 'checked' : ''}>
            <label for="dnd" class="checkbox-label">Блокировать уведомления во время сессии</label>
        </div>

        <button id="saveBtn">Применить изменения</button>

        <script>
            const vscode = acquireVsCodeApi();
            
            document.getElementById('preset').addEventListener('change', (e) => {
                document.getElementById('custom-fields').style.display = e.target.value === 'custom' ? 'block' : 'none';
            });

            document.getElementById('saveBtn').addEventListener('click', () => {
                const preset = document.getElementById('preset').value;
                const settings = {
                    preset: preset,
                    customFocusMin: parseInt(document.getElementById('focusMin').value) || 25,
                    customBreakMin: parseInt(document.getElementById('breakMin').value) || 5,
                    doNotDisturb: document.getElementById('dnd').checked,
                    autoStartBreak: true
                };
                vscode.postMessage({ command: 'saveSettings', settings });
            });
        </script>
    </body>
    </html>`;
}