import * as vscode from 'vscode';
import { StatusBarTimer } from './statusBar';
import { PomodoroTimer } from './timer';
import { StatsTracker } from './statsTracker';
import { SidebarProvider } from './sidebarProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "dev-focus" is now active!');

    const statusBarTimer = new StatusBarTimer();
    const statsTracker = new StatsTracker();
    
    const sidebarProvider = new SidebarProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            SidebarProvider.viewType,
            sidebarProvider
        )
    );
    
    // Единое объявление настроек с включенным DND
    const getSettings = () => ({ focusMin: 1, breakMin: 5, autoStartBreak: false, doNotDisturb: true });
    
    const onPomodoroComplete = () => {
        const stats = statsTracker.getStats();
        vscode.window.showInformationMessage(
            `Статистика сессии: ${stats.linesAdded} строк, ${stats.filesOpened} файлов, Топ язык: ${stats.topLanguage}`
        );
        statsTracker.stopTracking();
    };

    // Единое объявление таймера
    const timer = new PomodoroTimer(statusBarTimer, getSettings, onPomodoroComplete);

    context.subscriptions.push(statusBarTimer);
    context.subscriptions.push(statsTracker);
    context.subscriptions.push({ dispose: () => timer.dispose() });

    setInterval(() => {
        sidebarProvider.updatePanel(
            timer.getPhase(),
            timer.getRemaining(),
            statsTracker.getStats()
        );
    }, 1000);

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