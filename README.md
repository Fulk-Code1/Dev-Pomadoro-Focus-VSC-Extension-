# Dev Focus Pomodoro 🍅

<p align="center">
  <img src="images/preview.jpg" alt="Dev Focus Pomodoro Logo" width="258" height="103">
</p>

Dev Focus Pomodoro is not just a timer. It's a stylish, editor-integrated productivity tool that helps maintain deep focus and automatically tracks your coding efficiency.

Designed with aesthetics in mind: the deep dark background and neon accents blend perfectly into dark VS Code themes and reduce eye strain during long coding sessions.

---

## Features

* **🍅 Built-in Productivity Tracker:** During each session, the extension tracks:
  * Net lines of code added (with protection against auto-formatter false positives).
  * Number of opened and modified files.
  * Top programming language used most frequently in the session.
* **🍅 Do Not Disturb Mode:** Automatically blocks distracting VS Code pop-up notifications while you're in focus state.
* **🍅 Custom Notifications:** Stylish modal overlays with blur effect that auto-dismiss after 7 seconds — no interruptions if you step away.
* **🍅 Local Session History:** Save stats from your best days (pomodoros, lines of code, languages) directly in the sidebar.
* **🍅 Flexible Settings:** Use proven protocols (25/5, 50/10, 90/20) or set completely custom focus and break durations.

---

## How to Use

1. After installation, a 🍅 icon appears in your Activity Bar. Click it to open the **Dev Focus** panel.
2. Click **Start / Pause** to begin the focus timer. 🍅
3. Write code — the extension silently tracks your stats in the background.
4. When time is up, a smooth notification appears to start your break. Start it immediately or postpone it.
5. To adjust the timer or disable DND mode, click **Settings** in the sidebar.

---

## Technologies

* **TypeScript & Node.js:** Core business logic for the timer and file system tracking.
* **VS Code Webview API:** Fully custom UI for the sidebar and settings panel, powered by HTML/CSS/JS.
* **Event-Driven Architecture:** Uses `vscode.workspace.onDidChangeTextDocument` for accurate, lightweight on-the-fly code analysis.
* **Global State Storage:** Local storage for settings and history — no data sent to third-party servers.

---

## About 🍅

Publisher: **DenisMal**

Built by a developer, for developers — to make the coding process more focused and enjoyable.

---

**Dev Focus Pomodoro** 🍅🍅🍅 — Less distraction. More flow.