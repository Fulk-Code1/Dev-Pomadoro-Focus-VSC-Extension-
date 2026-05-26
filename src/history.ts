import * as vscode from 'vscode';

// Структура данных для одного дня
export interface DayRecord {
    date: string;           
    pomodoros: number;
    activeMs: number;
    linesAdded: number;
    filesOpened: number;
    topLanguage: string;
}

const HISTORY_KEY = 'devfocus.history';
const MAX_DAYS = 30;

export function saveDay(
    context: vscode.ExtensionContext,
    record: DayRecord
) {
    // Получаем текущую историю из хранилища
    const history: DayRecord[] = context.globalState.get(HISTORY_KEY, []);

    // Ищем запись за сегодня
    const today = new Date().toISOString().split('T')[0];
    const idx = history.findIndex(r => r.date === today);
    
    if (idx >= 0) {
        history[idx] = record; // Обновляем
    } else {
        history.push(record);  // Добавляем новую
    }

    // Сортируем по убыванию даты и оставляем только 30 последних дней
    history.sort((a,b) => b.date.localeCompare(a.date));
    const trimmed = history.slice(0, MAX_DAYS);

    // Сохраняем обратно в globalState
    context.globalState.update(HISTORY_KEY, trimmed);
}

export function getHistory(context: vscode.ExtensionContext): DayRecord[] {
    return context.globalState.get(HISTORY_KEY, []);
}

export function clearHistory(context: vscode.ExtensionContext) {
    context.globalState.update(HISTORY_KEY, []);
}