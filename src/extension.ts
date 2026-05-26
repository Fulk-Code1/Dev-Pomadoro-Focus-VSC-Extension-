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
    
    const onSessionComplete = (phase: 'focus' | 'break') => {
        if (phase === 'focus') {
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
            statsTracker.stopTracking();

            // Вызываем кастомное окно вместо нативного
            if (getSettings().autoStartBreak) {
                timer.startBreak();
                sidebarProvider.showNotification('FOCUS COMPLETE', `Pomodoros today: ${todayPomodoros}. Lines added: ${stats.linesAdded}`, 'focus', true);
            } else {
                sidebarProvider.showNotification('FOCUS COMPLETE', `Pomodoros today: ${todayPomodoros}. Lines added: ${stats.linesAdded}`, 'focus', false);
            }
        } else {
            sidebarProvider.showNotification('BREAK COMPLETE', 'Ready for another focus session?', 'break', false);
        }
    };

    const timer = new PomodoroTimer(statusBarTimer, getSettings, onSessionComplete);

    context.subscriptions.push(statusBarTimer);
    context.subscriptions.push(statsTracker);
    context.subscriptions.push({ dispose: () => timer.dispose() });

    context.subscriptions.push(
        vscode.commands.registerCommand('devfocus.openSettings', () => {
            openSettingsPanel(context, () => {
                timer.reset();
                sidebarProvider.updatePanel(timer.getPhase(), timer.getRemaining(), statsTracker.getStats());
            });
        })
    );

    setInterval(() => {
        sidebarProvider.updatePanel(timer.getPhase(), timer.getRemaining(), statsTracker.getStats());
        sidebarProvider.updateHistory(getHistory(context));
    }, 1000);

    let toggleCommand = vscode.commands.registerCommand('devfocus.toggleTimer', () => {
        const currentPhase = timer.getPhase();
        if (currentPhase === 'idle') {
            timer.start(); statsTracker.startTracking();
        } else if (currentPhase === 'focus' || currentPhase === 'break') {
            timer.pause(); statsTracker.stopTracking();
        } else if (currentPhase === 'paused') {
            timer.resume(); statsTracker.startTracking();
        }
        sidebarProvider.updatePanel(timer.getPhase(), timer.getRemaining(), statsTracker.getStats());
    });
    context.subscriptions.push(toggleCommand);

    let resetCommand = vscode.commands.registerCommand('devfocus.resetTimer', () => {
        timer.reset();
        sidebarProvider.updatePanel(timer.getPhase(), timer.getRemaining(), statsTracker.getStats());
    });
    context.subscriptions.push(resetCommand);

    // Новые команды, которые вызываются из кнопок неонового уведомления
    context.subscriptions.push(vscode.commands.registerCommand('devfocus.startBreak', () => {
        timer.startBreak();
        sidebarProvider.updatePanel(timer.getPhase(), timer.getRemaining(), statsTracker.getStats());
    }));
    
    context.subscriptions.push(vscode.commands.registerCommand('devfocus.startFocus', () => {
        timer.reset();
        timer.start();
        statsTracker.startTracking();
        sidebarProvider.updatePanel(timer.getPhase(), timer.getRemaining(), statsTracker.getStats());
    }));
}

export function deactivate() {}