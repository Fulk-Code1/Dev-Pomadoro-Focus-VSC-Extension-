import * as vscode from 'vscode';
import { StatusBarTimer } from './statusBar';
import { PomodoroTimer } from './timer';
import { StatsTracker } from './statsTracker';

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "dev-focus" is now active!');

    const statusBarTimer = new StatusBarTimer();
    const statsTracker = new StatsTracker();
    
    // ВРЕМЕННО ставим 1 минуту фокуса для быстрого тестирования
    const getSettings = () => ({ focusMin: 1, breakMin: 5, autoStartBreak: false });
    
    const onPomodoroComplete = () => {
        const stats = statsTracker.getStats();
        console.log('🍅 Помидор завершён! Статистика:', stats);
        
        // Показываем статистику прямо в уведомлении для наглядности
        vscode.window.showInformationMessage(
            `Статистика сессии: ${stats.linesAdded} строк, ${stats.filesOpened} файлов, Топ язык: ${stats.topLanguage}`
        );
        statsTracker.stopTracking();
    };

    const timer = new PomodoroTimer(statusBarTimer, getSettings, onPomodoroComplete);

    context.subscriptions.push(statusBarTimer);
    context.subscriptions.push(statsTracker);
    context.subscriptions.push({ dispose: () => timer.dispose() });

    // Логика клика по статус-бару
    let toggleCommand = vscode.commands.registerCommand('devfocus.toggleTimer', () => {
        const currentPhase = timer.getPhase();
        
        if (currentPhase === 'idle') {
            timer.start();
            statsTracker.startTracking();
        } else if (currentPhase === 'focus' || currentPhase === 'break') {
            timer.pause();
            statsTracker.stopTracking();
        } else if (currentPhase === 'paused') {
            timer.resume();
            statsTracker.startTracking();
        }
    });

    context.subscriptions.push(toggleCommand);
}

export function deactivate() {}