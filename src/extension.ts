import * as vscode from 'vscode';
import { StatusBarTimer } from './statusBar';

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "dev-focus" is now active!');

    // Инициализируем статус-бар
    const statusBarTimer = new StatusBarTimer();
    context.subscriptions.push(statusBarTimer);

    // Регистрируем команду клика по статус-бару (пока просто заглушка для проверки)
    let toggleCommand = vscode.commands.registerCommand('devfocus.toggleTimer', () => {
        vscode.window.showInformationMessage('Toggle Timer Command Executed');
    });

    context.subscriptions.push(toggleCommand);
}

export function deactivate() {}