import * as vscode from 'vscode';

export class StatusBarTimer {
    private item: vscode.StatusBarItem;

    constructor() {
        this.item = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left, 100
        );
        this.item.command = 'devfocus.toggleTimer';
        this.setIdle();
        this.item.show();
    }

    setIdle() {
        this.item.text = '$(circle-outline) Dev Focus';
        this.item.tooltip = 'Click to start Pomodoro';
        this.item.backgroundColor = undefined;
    }

    setFocus(remainingSeconds: number) {
        const m = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
        const s = (remainingSeconds % 60).toString().padStart(2, '0');
        this.item.text = `$(clock) ${m}:${s}  Focus  $(bell-slash)`;
        this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        this.item.tooltip = 'Click to pause';
    }

    setBreak(remainingSeconds: number) {
        const m = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
        const s = (remainingSeconds % 60).toString().padStart(2, '0');
        this.item.text = `$(coffee) ${m}:${s}  Break`;
        this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
        this.item.tooltip = 'Click to skip break';
    }

    dispose() { this.item.dispose(); }
}