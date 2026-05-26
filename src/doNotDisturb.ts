import * as vscode from 'vscode';

export async function enableDND() {
    try {
        const config = vscode.workspace.getConfiguration('notifications');
        const prev = config.get('doNotDisturb', false);
        if (!prev) {
            await config.update('doNotDisturb', true, vscode.ConfigurationTarget.Global);
        }
    } catch (e) {
        console.warn('DND mode is not supported in this VS Code version. Feature silently disabled.');
    }
}

export async function disableDND() {
    try {
        const config = vscode.workspace.getConfiguration('notifications');
        await config.update('doNotDisturb', false, vscode.ConfigurationTarget.Global);
    } catch (e) {
    }
}