import * as vscode from 'vscode';

export async function enableDND() {
    const config = vscode.workspace.getConfiguration('notifications');
    const prev = config.get('doNotDisturb', false);
    if (!prev) {
        await config.update('doNotDisturb', true, vscode.ConfigurationTarget.Global);
    }
}

export async function disableDND() {
    const config = vscode.workspace.getConfiguration('notifications');
    await config.update('doNotDisturb', false, vscode.ConfigurationTarget.Global);
}