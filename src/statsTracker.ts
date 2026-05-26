import * as vscode from 'vscode';

export class StatsTracker {
    private linesAdded = 0;
    private filesOpened = new Set<string>();
    private languages = new Map<string, number>();
    private activeMs = 0;
    
    private isTracking = false;
    private disposables: vscode.Disposable[] = [];
    private lastActiveTime = Date.now();
    // Изменили NodeJS.Timeout на универсальный ReturnType
    private activeInterval: ReturnType<typeof setInterval> | null = null;

    startTracking() {
        // Защита от двойного запуска: предотвращает умножение счетчика при паузах
        if (this.isTracking) {
            return;
        }
        
        this.isTracking = true;
        this.lastActiveTime = Date.now();

        this.disposables.push(
            vscode.workspace.onDidChangeTextDocument(e => {
                this.lastActiveTime = Date.now();

                for (const change of e.contentChanges) {
                    // Считаем количество новых переносов строк в добавленном тексте
                    const newLinesInserted = (change.text.match(/\n/g) || []).length;
                    
                    // Считаем количество строк, которые этот текст заменил/удалил
                    const linesDeleted = change.range.end.line - change.range.start.line;
                    
                    // Вычисляем чистую разницу. Это защищает от ложных срабатываний автоформаттеров
                    const netLinesAdded = newLinesInserted - linesDeleted;
                    
                    if (netLinesAdded > 0) {
                        this.linesAdded += netLinesAdded;
                    }
                }

                const lang = e.document.languageId;
                this.languages.set(lang, (this.languages.get(lang) || 0) + 1);
            }),
            vscode.workspace.onDidOpenTextDocument(doc => {
                this.filesOpened.add(doc.fileName);
            })
        );

        this.activeInterval = setInterval(() => {
            if (Date.now() - this.lastActiveTime < 60000) {
                this.activeMs += 1000;
            }
        }, 1000);
    }

    stopTracking() {
        if (!this.isTracking) {
            return;
        }
        this.isTracking = false;
        
        // Очищаем слушатели, чтобы избежать утечек памяти и задвоения событий
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
        
        if (this.activeInterval) {
            clearInterval(this.activeInterval);
            this.activeInterval = null;
        }
    }

    getStats() {
        let topLang = 'unknown';
        let maxCount = 0;
        this.languages.forEach((count, lang) => {
            if (count > maxCount) {
                maxCount = count;
                topLang = lang;
            }
        });

        return {
            linesAdded: this.linesAdded,
            filesOpened: this.filesOpened.size,
            topLanguage: topLang,
            activeMs: this.activeMs
        };
    }

    dispose() {
        this.stopTracking();
    }
}