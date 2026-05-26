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
        // Задаем начальное время при старте
        this.remaining = this.settings().focusMin * 60;
    }

    start() {
        if (this.phase === 'idle') {
            this.phase = 'focus';
            this.remaining = this.settings().focusMin * 60;
        }
        
        if (this.phase === 'focus' && this.settings().doNotDisturb) {
            enableDND().catch(console.error);
        }
        
        if (!this.interval) {
            this.interval = setInterval(() => this.tick(), 1000);
        }
    }

    pause() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.pausedPhase = this.phase;
        this.phase = 'paused';
        this.statusBar.setPaused(this.remaining);
        disableDND().catch(console.error);
    }

    resume() {
        if (this.phase !== 'paused') {
            return;
        }
        this.phase = this.pausedPhase!;
        this.start();
    }

    reset() {
        // Полностью уничтожаем текущий запущенный интервал
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        
        const s = this.settings();
        
        // Если сбрасываем во время перерыва — возвращаем начало перерыва, иначе — начало фокуса
        if (this.phase === 'break') {
            this.remaining = s.breakMin * 60;
            this.statusBar.setBreak(this.remaining);
        } else {
            this.phase = 'idle';
            this.remaining = s.focusMin * 60;
            this.statusBar.setIdle();
        }
        
        disableDND().catch(console.error);
    }

    skip() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.phase = 'idle';
        this.statusBar.setIdle();
        disableDND().catch(console.error);
    }

    private tick() {
        this.remaining--;
        
        if (this.phase === 'focus') {
            if (this.settings().doNotDisturb) {
                const m = Math.floor(this.remaining / 60).toString().padStart(2, '0');
                const s = (this.remaining % 60).toString().padStart(2, '0');
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
                this.interval = null;
            }
            
            if (this.phase === 'focus') {
                disableDND().catch(console.error);
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
            this.interval = null;
        }
        disableDND().catch(console.error); 
    }
}