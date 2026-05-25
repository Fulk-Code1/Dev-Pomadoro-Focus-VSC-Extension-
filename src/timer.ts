import * as vscode from 'vscode';
import { StatusBarTimer } from './statusBar';
import { enableDND, disableDND } from './doNotDisturb';

export type Phase = 'idle' | 'focus' | 'break' | 'paused';

export class PomodoroTimer {
    private phase: Phase = 'idle';
    private remaining: number = 0;
    private interval: ReturnType<typeof setInterval> | null = null;
    private pausedPhase: Phase | null = null;
    private onPomodoroComplete: () => void;

    constructor(
        private statusBar: StatusBarTimer,
        private settings: () => { focusMin: number; breakMin: number; autoStartBreak: boolean; doNotDisturb: boolean },
        onPomodoroComplete: () => void
    ) {
        this.onPomodoroComplete = onPomodoroComplete;
    }

    start() {
        if (this.phase === 'idle') {
            this.phase = 'focus';
            this.remaining = this.settings().focusMin * 60;
        }
        
        // Включаем DND только если мы в фокусе и настройка активирована
        if (this.phase === 'focus' && this.settings().doNotDisturb) {
            enableDND().catch(console.error);
        }
        
        this.interval = setInterval(() => this.tick(), 1000);
    }

    pause() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.pausedPhase = this.phase;
        this.phase = 'paused';
        this.statusBar.setPaused(this.remaining);
        
        // Снимаем блокировку на время паузы
        disableDND().catch(console.error);
    }

    resume() {
        if (this.phase !== 'paused') {
            return;
        }
        this.phase = this.pausedPhase!;
        this.start(); // start() сам проверит фазу и снова включит DND, если нужно
    }

    reset() {
        if (this.interval) {
            clearInterval(this.interval);
        }
        const s = this.settings();
        this.remaining = this.phase === 'break' ? s.breakMin * 60 : s.focusMin * 60;
        this.phase = this.phase === 'break' ? 'break' : 'focus';
        disableDND().catch(console.error);
    }

    skip() {
        if (this.interval) {
            clearInterval(this.interval);
        }
        this.phase = 'idle';
        this.statusBar.setIdle();
        disableDND().catch(console.error);
    }

    private tick() {
        this.remaining--;
        
        if (this.phase === 'focus') {
            // Добавляем иконку перечеркнутого колокольчика, если DND включен
            if (this.settings().doNotDisturb) {
                const m = Math.floor(this.remaining / 60).toString().padStart(2, '0');
                const s = (this.remaining % 60).toString().padStart(2, '0');
                // Переопределяем текст статус-бара напрямую, чтобы добавить иконку
                this.statusBar['item'].text = `$(clock) ${m}:${s}  Focus  $(bell-slash)`;
            } else {
                this.statusBar.setFocus(this.remaining);
            }
        } else {
            this.statusBar.setBreak(this.remaining);
        }

        if (this.remaining <= 0) {
            if (this.interval) {
                clearInterval(this.interval);
            }
            
            if (this.phase === 'focus') {
                disableDND().catch(console.error); // Снимаем DND при завершении фокуса
                this.onPomodoroComplete();
                
                vscode.window.showInformationMessage(
                    '🍅 Focus session complete! Time for a break.',
                    'Start Break', 'Later'
                ).then(choice => {
                    if (choice === 'Start Break' || this.settings().autoStartBreak) {
                        this.phase = 'break';
                        this.remaining = this.settings().breakMin * 60;
                        this.start();
                    } else {
                        this.phase = 'idle';
                        this.statusBar.setIdle();
                    }
                });
            } else {
                this.phase = 'idle';
                this.statusBar.setIdle();
                vscode.window.showInformationMessage(
                    '☕ Break complete! Ready for another focus session?',
                    'Start Focus', 'Later'
                );
            }
        }
    }

    getPhase() { return this.phase; }
    getRemaining() { return this.remaining; }
    dispose() { 
        if (this.interval) {
            clearInterval(this.interval);
        }
        disableDND().catch(console.error);
    }
}