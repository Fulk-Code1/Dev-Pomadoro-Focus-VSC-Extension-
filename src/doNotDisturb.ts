import * as vscode from 'vscode';

export async function enableDND() {
    try {
        const config = vscode.workspace.getConfiguration('notifications');
        const prev = config.get('doNotDisturb', false);
        if (!prev) {
            await config.update('doNotDisturb', true, vscode.ConfigurationTarget.Global);
        }
    } catch (e) {
        console.warn('Режим DND не поддерживается в этой версии VS Code. Функция тихо отключена.');
    }
}

export async function disableDND() {
    try {
        const config = vscode.workspace.getConfiguration('notifications');
        await config.update('doNotDisturb', false, vscode.ConfigurationTarget.Global);
    } catch (e) {
    }
}