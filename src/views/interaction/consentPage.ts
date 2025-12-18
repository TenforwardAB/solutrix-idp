import { escapeHtml, renderHtmlDocument } from "../html.js";

export type ConsentPageParams = {
    uid: string;
    clientName?: string;
    clientId?: string;
    scope?: string;
};

export const renderConsentPage = (params: ConsentPageParams): string => {
    const { uid } = params;
    const displayClient = params.clientName || params.clientId || "Client";
    const scopeList = (params.scope || "").split(" ").filter(Boolean);
    const scopeMarkup =
        scopeList
            .map(
                (scope) =>
                    `<span style="display:inline-block;padding:6px 10px;margin:4px;border-radius:10px;background:#e2e8f0;font-weight:600;font-size:13px;color:#0f172a;">${escapeHtml(
                        scope,
                    )}</span>`,
            )
            .join("") || '<em style="color:#475569;">No scopes requested</em>';

    const head = `  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin:0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #0b1929; display:flex; min-height:100vh; align-items:center; justify-content:center; }
    main { background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:16px; padding:28px; width:min(520px, calc(100% - 32px)); color:#f8fafc; box-shadow:0 24px 60px rgba(0,0,0,0.35); }
    h1 { margin:0 0 6px; font-size:22px; }
    p { margin:4px 0 10px; color:#cbd5e1; }
    form { margin-top:14px; display:flex; gap:12px; }
    button { border:none; border-radius:10px; padding:12px 16px; font-weight:700; cursor:pointer; font-size:14px; }
    .approve { background: linear-gradient(135deg,#22d3ee,#6366f1); color:#0b1929; box-shadow:0 10px 30px rgba(99,102,241,0.35); }
    .deny { background:#0f172a; color:#e2e8f0; border:1px solid #1e293b; }
    .scopes { margin:12px 0 6px; }
  </style>`;

    const body = `  <main>
    <h1>Allow ${escapeHtml(displayClient)}?</h1>
    <p>This application is requesting access with the following scopes:</p>
    <div class="scopes">${scopeMarkup}</div>
    <form method="post" action="/interaction/${encodeURIComponent(uid)}/confirm">
      <button class="approve" type="submit">Allow</button>
    </form>
    <form method="post" action="/interaction/${encodeURIComponent(uid)}/abort">
      <button class="deny" type="submit">Deny</button>
    </form>
  </main>`;

    return renderHtmlDocument({
        title: `Consent · ${displayClient}`,
        head,
        body,
    });
};

