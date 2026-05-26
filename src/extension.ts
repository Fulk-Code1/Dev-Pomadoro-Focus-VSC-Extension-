import * as vscode from 'vscode';
import { StatusBarTimer } from './statusBar';
import { PomodoroTimer } from './timer';
import { StatsTracker } from './statsTracker';
import { SidebarProvider } from './sidebarProvider';
import { saveDay, DayRecord, getHistory } from './history';

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
    
    const getSettings = () => ({ focusMin: 1, breakMin: 5, autoStartBreak: false, doNotDisturb: true });
    
    // Счетчик завершенных сессий за текущий запуск
    let todayPomodoros = 0; 
    
    const onPomodoroComplete = () => {
        todayPomodoros++;
        const stats = statsTracker.getStats();
        
        // Формируем запись и сохраняем в globalState
        const todayStr = new Date().toISOString().split('T')[0];
        const record: DayRecord = {
            date: todayStr,
            pomodoros: todayPomodoros,
            activeMs: stats.activeMs,
            linesAdded: stats.linesAdded,
            filesOpened: stats.filesOpened,
            topLanguage: stats.topLanguage
        };
        saveDay(context, record);

        // Для отладки выведем в консоль текущую сохраненную историю
        console.log('Сохраненная история:', getHistory(context));

        vscode.window.showInformationMessage(
            `🍅 Фокус завершён! Сегодня помидоров: ${todayPomodoros}. Строк: ${stats.linesAdded}`
        );
        statsTracker.stopTracking();
    };

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