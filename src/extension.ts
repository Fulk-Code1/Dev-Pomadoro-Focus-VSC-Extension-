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
    
    // Функция для чтения актуальных настроек из globalState
    const getSettings = () => {
        const s = context.globalState.get('devfocus.settings', {
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
        
        // Сразу обновляем историю в панели
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

    // Обработчик команды открытия настроек из Webview
    context.subscriptions.push(
        vscode.commands.registerCommand('devfocus.openSettings', () => {
            openSettingsPanel(context, () => {
                // Если таймер не запущен, сбрасываем его, чтобы применить новые настройки времени
                if (timer.getPhase() === 'idle') {
                    timer.reset();
                }
            });
        })
    );

    // Слушаем сообщения от провайдера для открытия настроек
    sidebarProvider['resolveWebviewView'] = function(webviewView, ctx, token) {
        SidebarProvider.prototype.resolveWebviewView.call(this, webviewView, ctx, token);
        webviewView.webview.onDidReceiveMessage(data => {
            if (data.command === 'openSettings') {
                vscode.commands.executeCommand('devfocus.openSettings');
            }
        });
    };

    // Главный цикл обновления UI
    setInterval(() => {
        sidebarProvider.updatePanel(
            timer.getPhase(),
            timer.getRemaining(),
            statsTracker.getStats()
        );
        // Периодически отправляем историю (можно оптимизировать, но для MVP отлично)
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
    });

    context.subscriptions.push(toggleCommand);
}

export function deactivate() {}