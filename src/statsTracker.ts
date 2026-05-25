import * as vscode from 'vscode';

export class StatsTracker {
    private linesAdded = 0;
    private filesOpened = new Set<string>();
    private activeMs = 0;
    private lastActivityAt: number | null = null;
    private langTime: Record<string, number> = {};
    private readonly ACTIVITY_TIMEOUT_MS = 30_000; // 30 секунд
    private disposables: vscode.Disposable[] = [];
    private isTracking = false;

    startTracking() {
        this.isTracking = true;

        // Считаем добавленные строки
        this.disposables.push(
            vscode.workspace.onDidChangeTextDocument(e => {
                if (!this.isTracking) {
                    return;
                }
                for (const change of e.contentChanges) {
                    const newLines = (change.text.match(/\n/g) || []).length;
                    if (newLines > 0) {
                        this.linesAdded += newLines;
                    }
                }
                
                // Считаем активное время
                const now = Date.now();
                if (this.lastActivityAt !== null) {
                    const diff = now - this.lastActivityAt;
                    if (diff < this.ACTIVITY_TIMEOUT_MS) {
                        this.activeMs += diff;
                    }
                }
                this.lastActivityAt = now;

                // Считаем язык
                const lang = e.document.languageId;
                this.langTime[lang] = (this.langTime[lang] || 0) + 1;
            })
        );

        // Считаем открытые файлы
        this.disposables.push(
            vscode.workspace.onDidOpenTextDocument(doc => {
                if (!this.isTracking) {
                    return;
                }
                // Игнорируем системные выводы и git-файлы
                if (!doc.uri.scheme.startsWith('git') && !doc.uri.scheme.startsWith('output')) {
                    this.filesOpened.add(doc.uri.toString());
                }
            })
        );
    }

    stopTracking() {
        this.isTracking = false;
        this.lastActivityAt = null; // Сбрасываем таймер активности при остановке
    }

    getTopLanguage(): string {
        const entries = Object.entries(this.langTime);
        if (entries.length === 0) {
            return 'unknown';
        }
        return entries.sort((a, b) => b[1] - a[1])[0][0];
    }

    getStats() {
        return {
            linesAdded: this.linesAdded,
            filesOpened: this.filesOpened.size,
            activeMs: this.activeMs,
            topLanguage: this.getTopLanguage(),
        };
    }

    dispose() {
        this.disposables.forEach(d => d.dispose());
    }
}