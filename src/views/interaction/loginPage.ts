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
    <style>
        :root {
            color-scheme: light dark;
        }

        body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            display: flex;
            min-height: 100vh;
            margin: 0;
            align-items: center;
            justify-content: center;
            background: #0b1929;
            background: radial-gradient(circle at 10% 20%, #1b2530 0%, #0b1929 90%);
        }

        main {
            background: rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 32px;
            width: min(420px, calc(100% - 32px));
            box-shadow: 0 18px 40px rgba(11, 25, 41, 0.35);
            backdrop-filter: blur(18px);
            color: #f6f7fb;
        }

        h1 {
            margin-top: 0;
            font-size: 1.75rem;
            font-weight: 600;
        }

        p.scope {
            opacity: 0.75;
            font-size: 0.9rem;
            margin-bottom: 24px;
        }

        form {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        label {
            display: flex;
            flex-direction: column;
            gap: 6px;
            font-weight: 500;
        }

        input {
            padding: 12px;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            background: rgba(11, 25, 41, 0.5);
            color: inherit;
            font-size: 1rem;
        }

        input:focus {
            outline: 2px solid rgba(83, 187, 255, 0.6);
            outline-offset: 1px;
        }

        button {
            padding: 12px 16px;
            background: linear-gradient(135deg, #4cc2ff 0%, #5777ff 100%);
            color: #0b1929;
            border: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: transform 120ms ease, box-shadow 120ms ease;
        }

        button:hover {
            transform: translateY(-1px);
            box-shadow: 0 8px 18px rgba(87, 119, 255, 0.3);
        }

        .error {
            background: rgba(255, 85, 89, 0.18);
            border: 1px solid rgba(255, 85, 89, 0.4);
            color: #ff8587;
            padding: 12px 14px;
            border-radius: 10px;
        }

        .footer {
            margin-top: 24px;
            font-size: 0.8rem;
            opacity: 0.5;
            text-align: center;
        }
    </style>`;

    const body = `<main>
    <h1>${escapeHtml(clientName)}</h1>
    ${scope ? `<p class="scope">Requesting: ${escapeHtml(scope)}</p>` : ""}
    ${error ? `<div class="error">${escapeHtml(error)}</div>` : ""}
    <form method="post" action="/interaction/${encodeURIComponent(uid)}/login">
        <input type="hidden" name="uid" value="${escapeHtml(uid)}" />
        <label>
            Email address
            <input type="email" name="username" autocomplete="username" required value="${escapeHtml(username)}" />
        </label>
        <label>
            Password
            <input type="password" name="password" autocomplete="current-password" required />
        </label>
        <button type="submit">Continue</button>
    </form>
    <div class="footer">Solutrix Identity Provider</div>
</main>`;

    return renderHtmlDocument({
        title: `${clientName} · Sign in`,
        head,
        body,
    });
};

