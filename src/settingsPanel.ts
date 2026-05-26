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
            body { font-family: var(--vscode-font-family); padding: 20px; max-width: 500px; color: var(--vscode-foreground); }
            .form-group { margin-bottom: 20px; }
            label { display: block; margin-bottom: 5px; font-weight: bold; }
            select, input[type="number"] { 
                background: var(--vscode-input-background); 
                color: var(--vscode-input-foreground); 
                border: 1px solid var(--vscode-input-border); 
                padding: 5px; 
                width: 100%; 
            }
            .checkbox-group { display: flex; align-items: center; }
            .checkbox-group input { width: auto; margin-right: 10px; }
            button {
                background: #8A2BE2;
                color: #ffffff;
                border: none;
                padding: 10px 20px;
                cursor: pointer;
                font-weight: bold;
                margin-top: 10px;
                border-radius: 4px;
            }
            button:hover { background: #9370DB; }
        </style>
    </head>
    <body>
        <h2>Настройки Dev Focus</h2>
        
        <div class="form-group">
            <label>Пресет таймера</label>
            <select id="preset">
                <option value="25/5" ${settings.preset === '25/5' ? 'selected' : ''}>25 минут фокус / 5 минут перерыв</option>
                <option value="50/10" ${settings.preset === '50/10' ? 'selected' : ''}>50 минут фокус / 10 минут перерыв</option>
                <option value="90/20" ${settings.preset === '90/20' ? 'selected' : ''}>90 минут фокус / 20 минут перерыв</option>
                <option value="custom" ${settings.preset === 'custom' ? 'selected' : ''}>Кастомный</option>
            </select>
        </div>

        <div id="custom-fields" style="display: ${settings.preset === 'custom' ? 'block' : 'none'};">
            <div class="form-group">
                <label>Кастомный фокус (мин)</label>
                <input type="number" id="focusMin" value="${settings.customFocusMin}" min="1" max="180">
            </div>
            <div class="form-group">
                <label>Кастомный перерыв (мин)</label>
                <input type="number" id="breakMin" value="${settings.customBreakMin}" min="1" max="60">
            </div>
        </div>

        <div class="form-group checkbox-group">
            <input type="checkbox" id="dnd" ${settings.doNotDisturb ? 'checked' : ''}>
            <label for="dnd">Блокировать уведомления</label>
        </div>

        <button id="saveBtn">Сохранить</button>

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