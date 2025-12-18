import { escapeHtml, renderHtmlDocument } from "../html.js";

export type LoginPageParams = {
    uid: string;
    clientName: string;
    scope?: string;
    username?: string;
    error?: string;
};

export const renderLoginPage = (params: LoginPageParams): string => {
    const { uid, clientName, scope, username, error } = params;
    const head = `    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css" />
    <style>
        :root {
            --pico-font-family: "Inter", "Segoe UI", "Helvetica Neue", system-ui, -apple-system, sans-serif;
            --pico-primary: #0f6fff;
            --pico-primary-background: #0f6fff;
            --pico-primary-underline: rgba(15, 111, 255, 0.25);
            --pico-border-radius: 16px;
            --bg-gradient: radial-gradient(circle at 16% 20%, #dbeafe 0%, #eff6ff 22%, transparent 22%),
                radial-gradient(circle at 80% 10%, #e0f2fe 0%, #e5ecff 24%, transparent 24%),
                linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
            --panel-bg: #ffffff;
            --panel-border: #e2e8f0;
            --panel-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
            --text-strong: #0f172a;
            --text-muted: #475569;
            --chip-bg: rgba(15, 111, 255, 0.08);
            --chip-text: #0f3e9c;
            --accent-gradient: radial-gradient(circle at 25% 20%, rgba(15, 111, 255, 0.12), transparent 40%),
                radial-gradient(circle at 90% 30%, rgba(14, 165, 233, 0.14), transparent 36%),
                linear-gradient(160deg, #0ea5e9 0%, #0f6fff 55%, #312e81 100%);
            color-scheme: light dark;
        }

        [data-theme="dark"] {
            --bg-gradient: radial-gradient(circle at 20% 20%, rgba(15, 23, 42, 0.75) 0%, rgba(15, 23, 42, 0.55) 24%, transparent 26%),
                radial-gradient(circle at 80% 10%, rgba(30, 41, 59, 0.7) 0%, rgba(17, 24, 39, 0.55) 28%, transparent 30%),
                linear-gradient(180deg, #0f172a 0%, #111827 100%);
            --panel-bg: #0f172a;
            --panel-border: #1f2937;
            --panel-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
            --text-strong: #e2e8f0;
            --text-muted: #cbd5e1;
            --chip-bg: rgba(80, 130, 255, 0.18);
            --chip-text: #bfdbfe;
            --accent-gradient: radial-gradient(circle at 25% 20%, rgba(59, 130, 246, 0.22), transparent 40%),
                radial-gradient(circle at 90% 30%, rgba(56, 189, 248, 0.24), transparent 36%),
                linear-gradient(160deg, #0ea5e9 0%, #1d4ed8 55%, #312e81 100%);
        }

        body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 32px;
            background: var(--bg-gradient);
            color: var(--text-strong);
        }

        main {
            width: min(1080px, 100%);
            display: grid;
            gap: 22px;
            grid-template-columns: repeat(1, minmax(0, 1fr));
        }

        @media (min-width: 720px) {
            main {
                grid-template-columns: 7fr 5fr;
            }
        }

        .panel {
            background: var(--panel-bg);
            border: 1px solid var(--panel-border);
            border-radius: 18px;
            padding: 26px 28px;
            box-shadow: var(--panel-shadow);
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 6px;
        }

        .brand img {
            width: 64px;
            height: 64px;
            border-radius: 14px;
            border: 1px solid var(--panel-border);
            padding: 12px;
            background: linear-gradient(145deg, #f8fafc, #e2e8f0);
            object-fit: contain;
        }

        .eyebrow {
            margin: 0;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--text-muted);
        }

        h1 {
            margin: 4px 0 4px;
            font-size: 1.8rem;
            color: var(--text-strong);
        }

        .subtitle {
            margin: 0;
            color: var(--text-muted);
            font-size: 1rem;
        }

        form {
            margin-top: 16px;
            display: flex;
            flex-direction: column;
            gap: 14px;
        }

        label {
            font-weight: 600;
            color: var(--text-strong);
        }

        input {
            margin-top: 8px;
        }

        .chip {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 12px;
            border-radius: 999px;
            background: var(--chip-bg);
            color: var(--chip-text);
            font-weight: 600;
            font-size: 0.95rem;
        }

        .notice {
            padding: 12px 14px;
            border-radius: 14px;
            border: 1px solid var(--panel-border);
            background: rgba(148, 163, 184, 0.08);
            font-weight: 600;
            color: var(--text-strong);
        }

        .notice.error {
            border-color: rgba(239, 68, 68, 0.35);
            background: rgba(239, 68, 68, 0.12);
            color: #f87171;
        }

        .form-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            margin-top: 4px;
            color: var(--text-muted);
            font-size: 0.95rem;
        }

        .accent {
            background: var(--accent-gradient);
            color: #e2e8f0;
            border: none;
            position: relative;
            overflow: hidden;
        }

        .accent::after {
            content: "";
            position: absolute;
            inset: 14px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 14px;
            pointer-events: none;
        }

        .accent h2 {
            margin: 4px 0 8px;
            font-size: 1.5rem;
        }

        .accent p {
            color: rgba(226, 232, 240, 0.9);
        }

        .accent .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.14);
            font-weight: 700;
            letter-spacing: 0.04em;
        }

        .accent .logo-mark {
            width: 56px;
            height: 56px;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.14);
            display: grid;
            place-items: center;
            border: 1px solid rgba(255, 255, 255, 0.18);
        }

        .accent .logo-mark img {
            width: 40px;
            height: 40px;
            object-fit: contain;
            filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.2));
        }

        .highlights {
            list-style: none;
            padding: 0;
            margin: 14px 0 0;
            display: grid;
            gap: 8px;
        }

        .highlights li {
            display: flex;
            gap: 10px;
            align-items: center;
            padding: 10px 12px;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.08);
            color: #e2e8f0;
            font-weight: 600;
        }

        .pill-icon {
            width: 9px;
            height: 9px;
            border-radius: 999px;
            background: #a5f3fc;
            display: inline-block;
        }

        .fineprint {
            margin-top: 20px;
            color: var(--text-muted);
            font-size: 0.9rem;
        }

        .theme-toggle {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            margin-bottom: 10px;
            grid-column: 1 / -1;
        }

        .theme-toggle button {
            margin: 0;
            padding: 10px 12px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        .icon {
            font-size: 18px;
            line-height: 1;
        }

        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            border: 0;
        }
    </style>`;

    const body = `<main>
    <div class="theme-toggle">
        <button type="button" class="secondary" data-theme-toggle onclick="window.solutrixToggleTheme?.()">
            <span class="icon" aria-hidden="true">☀️</span>
            <span class="sr-only">Toggle theme</span>
        </button>
    </div>
    <article class="panel">
        <div class="brand">
            <img src="/solutrix-placeholder.png" alt="Solutrix logo placeholder" />
            <div>
                <p class="eyebrow">Solutrix Identity</p>
                <h1>Sign in</h1>
                <p class="subtitle">Continue to ${escapeHtml(clientName)}</p>
            </div>
        </div>
        ${scope ? `<div class="chip">Requesting access: ${escapeHtml(scope)}</div>` : ""}
        ${error ? `<div class="notice error" role="alert">${escapeHtml(error)}</div>` : ""}
        <form method="post" action="/interaction/${encodeURIComponent(uid)}/login">
            <input type="hidden" name="uid" value="${escapeHtml(uid)}" />
            <label>
                Work or personal email
                <input type="email" name="username" autocomplete="username" required value="${escapeHtml(username)}" placeholder="you@company.com" />
            </label>
            <label>
                Password
                <input type="password" name="password" autocomplete="current-password" required placeholder="Enter your password" />
            </label>
            <button type="submit">Continue</button>
        </form>
        <div class="form-footer">
            <span>Solutrix protects your session with modern security.</span>
            <small class="eyebrow" style="letter-spacing: 0.02em;">Help</small>
        </div>
    </article>

    <article class="panel accent">
        <div class="badge">
            <span class="pill-icon"></span>
            Solutrix Cloud Identity
        </div>
        <h2>Trusted access, Google-simple with Entra polish.</h2>
        <p>One clean sign-in for every Solutrix-powered app. Strong MFA, clear scopes, and a frictionless experience your teams already know.</p>
        <div class="logo-mark">
            <img src="/solutrix-placeholder.png" alt="Solutrix brand mark" />
        </div>
        <ul class="highlights">
            <li><span class="pill-icon"></span>Fast identity hand-offs with clear consent</li>
            <li><span class="pill-icon"></span>Adaptive security tuned for modern workloads</li>
            <li><span class="pill-icon"></span>Designed to mirror the clarity of Google and Entra</li>
        </ul>
        <p class="fineprint">You can replace the placeholder logo at <code>/public/solutrix-placeholder.png</code>.</p>
    </article>
</main>
<script>
(() => {
    const storageKey = "solutrix-theme";
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = (value) => {
        const mode = value === "light" || value === "dark" ? value : "auto";
        const effective = mode === "auto" ? (prefersDark.matches ? "dark" : "light") : mode;

        document.documentElement.setAttribute("data-theme", effective);
        document.documentElement.setAttribute("data-theme-mode", mode);

        const button = document.querySelector("[data-theme-toggle]");
        if (button) {
            const icon = mode === "auto" ? (prefersDark.matches ? "🌙" : "☀️") : mode === "dark" ? "🌙" : "☀️";
            button.querySelector(".icon")?.replaceChildren(document.createTextNode(icon));
        }
    };

    const stored = localStorage.getItem(storageKey);
    applyTheme(stored || "auto");

    window.solutrixToggleTheme = () => {
        const currentMode = document.documentElement.getAttribute("data-theme-mode") || "auto";
        const next = currentMode === "auto" ? "light" : currentMode === "light" ? "dark" : "auto";
        localStorage.setItem(storageKey, next);
        applyTheme(next);
    };

    prefersDark.addEventListener("change", () => {
        if ((localStorage.getItem(storageKey) || "auto") === "auto") {
            applyTheme("auto");
        }
    });
})();
</script>`;

    return renderHtmlDocument({
        title: `${clientName} · Sign in`,
        head,
        body,
    });
};
