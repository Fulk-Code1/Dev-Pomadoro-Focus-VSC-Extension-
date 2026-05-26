import * as vscode from 'vscode';
import { StatusBarTimer } from './statusBar';
import { PomodoroTimer } from './timer';
import { StatsTracker } from './statsTracker';
import { SidebarProvider } from './sidebarProvider';
import { saveDay, DayRecord, getHistory } from './history';
import { openSettingsPanel } from './settingsPanel';

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
    
    const getSettings = () => {
        const s = context.globalState.get<any>('devfocus.settings', {
            preset: '25/5', customFocusMin: 25, customBreakMin: 5, doNotDisturb: true, autoStartBreak: true
        });
        
        let focusMin = 25; let breakMin = 5;
        if (s.preset === '25/5') { focusMin = 25; breakMin = 5; }
        else if (s.preset === '50/10') { focusMin = 50; breakMin = 10; }
        else if (s.preset === '90/20') { focusMin = 90; breakMin = 20; }
        else { focusMin = s.customFocusMin; breakMin = s.customBreakMin; }

        return { focusMin, breakMin, autoStartBreak: s.autoStartBreak, doNotDisturb: s.doNotDisturb };
    };
    
    let todayPomodoros = 0; 
    
    const onPomodoroComplete = () => {
        todayPomodoros++;
        const stats = statsTracker.getStats();
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
        
        sidebarProvider.updateHistory(getHistory(context));

        vscode.window.showInformationMessage(
            `🍅 Фокус завершён! Сегодня помидоров: ${todayPomodoros}. Строк: ${stats.linesAdded}`
        );
        statsTracker.stopTracking();
    };

    const timer = new PomodoroTimer(statusBarTimer, getSettings, onPomodoroComplete);

    context.subscriptions.push(statusBarTimer);
    context.subscriptions.push(statsTracker);
    context.subscriptions.push({ dispose: () => timer.dispose() });

    // Регистрация команды открытия настроек
    context.subscriptions.push(
        vscode.commands.registerCommand('devfocus.openSettings', () => {
            openSettingsPanel(context, () => {
                // Вызываем сброс таймера
                timer.reset();
                // Принудительно обновляем UI сразу после сохранения настроек
                sidebarProvider.updatePanel(
                    timer.getPhase(),
                    timer.getRemaining(),
                    statsTracker.getStats()
                );
            });
        })
    );

    // Интервал обновления интерфейса боковой панели
    setInterval(() => {
        sidebarProvider.updatePanel(
            timer.getPhase(),
            timer.getRemaining(),
            statsTracker.getStats()
        );
        sidebarProvider.updateHistory(getHistory(context));
    }, 1000);

    // Регистрация команды Старт/Пауза
    let toggleCommand = vscode.commands.registerCommand('devfocus.toggleTimer', () => {
        const currentPhase = timer.getPhase();
        if (currentPhase === 'idle') {
            timer.start(); statsTracker.startTracking();
        } else if (currentPhase === 'focus' || currentPhase === 'break') {
            timer.pause(); statsTracker.stopTracking();
        } else if (currentPhase === 'paused') {
            timer.resume(); statsTracker.startTracking();
        }
        
        // Мгновенное обновление UI при старте/паузе
        sidebarProvider.updatePanel(
            timer.getPhase(),
            timer.getRemaining(),
            statsTracker.getStats()
        );
    });
    context.subscriptions.push(toggleCommand);

    // Регистрация команды Сброса таймера
    let resetCommand = vscode.commands.registerCommand('devfocus.resetTimer', () => {
        timer.reset();
        
        // Принудительно и мгновенно обновляем интерфейс боковой панели при сбросе
        sidebarProvider.updatePanel(
            timer.getPhase(),
            timer.getRemaining(),
            statsTracker.getStats()
        );
    });
    context.subscriptions.push(resetCommand);
}

export function deactivate() {}