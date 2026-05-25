import * as vscode from 'vscode';
import { StatusBarTimer } from './statusBar';
import { PomodoroTimer } from './timer';

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "dev-focus" is now active!');

    const statusBarTimer = new StatusBarTimer();
    
    // Пока хардкодим настройки для тестов. Позже переведем на глобальный стейт.
    const getSettings = () => ({ focusMin: 25, breakMin: 5, autoStartBreak: false });
    
    const onPomodoroComplete = () => {
        console.log('Помидор завершён! Тут позже будет логика статистики.');
    };

    const timer = new PomodoroTimer(statusBarTimer, getSettings, onPomodoroComplete);

    context.subscriptions.push(statusBarTimer);
    context.subscriptions.push({ dispose: () => timer.dispose() });

    // Логика клика по статус-бару
    let toggleCommand = vscode.commands.registerCommand('devfocus.toggleTimer', () => {
        const currentPhase = timer.getPhase();
        
        if (currentPhase === 'idle') {
            timer.start();
        } else if (currentPhase === 'focus' || currentPhase === 'break') {
            timer.pause();
        } else if (currentPhase === 'paused') {
            timer.resume();
        }
    });

    context.subscriptions.push(toggleCommand);
}

export function deactivate() {}