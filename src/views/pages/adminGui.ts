import { escapeHtml } from "../html.js";

export const renderAdminGuiPage = (masterUser: string): string => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Solutrix IDP Admin GUI</title>
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
    }

    body {
      margin: 0;
      min-height: 100vh;
      background: var(--bg-gradient);
      color: var(--text-strong);
      display: flex;
      justify-content: center;
      padding: 32px 18px 48px;
    }

    .shell {
      width: min(1200px, 100%);
      display: grid;
      gap: 18px;
    }

    header.hero {
      background: linear-gradient(160deg, #0ea5e9 0%, #0f6fff 55%, #312e81 100%);
      color: #e2e8f0;
      border-radius: 18px;
      padding: 22px 26px;
      box-shadow: var(--panel-shadow);
      position: relative;
      overflow: hidden;
    }

    header.hero::after {
      content: "";
      position: absolute;
      inset: 14px;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      pointer-events: none;
    }

    .brand-line {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .brand-mark {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      display: grid;
      place-items: center;
      background: rgba(255, 255, 255, 0.14);
      border: 1px solid rgba(255, 255, 255, 0.18);
    }

    .grid {
      display: grid;
      gap: 18px;
      grid-template-columns: 1fr;
    }

    @media (min-width: 960px) {
      .grid {
        grid-template-columns: 7fr 5fr;
      }
    }

    .panel {
      background: var(--panel-bg);
      border: 1px solid var(--panel-border);
      border-radius: 18px;
      padding: 22px 22px 24px;
      box-shadow: var(--panel-shadow);
    }

    .muted {
      color: var(--text-muted);
      font-size: 0.95rem;
    }

    .row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 12px;
    }

    .hidden { display: none; }

    textarea {
      min-height: 120px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }

    pre {
      background: #0f172a;
      color: #e2e8f0;
      border-radius: 12px;
      padding: 14px;
      border: 1px solid #1e293b;
      overflow-x: auto;
      min-height: 200px;
    }

    .topbar {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 10px;
      grid-column: 1 / -1;
    }

    .theme-toggle {
      margin: 0;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 9px 12px;
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
  </style>
</head>
<body>
  <div class="shell">
    <header class="hero">
      <div class="brand-line">
        <div class="brand-mark">ID</div>
        <div>
          <p style="margin:0;font-weight:700;letter-spacing:0.08em;font-size:13px;">Solutrix Identity</p>
          <h1 style="margin:4px 0 4px;font-size:1.6rem;">Admin Console</h1>
          <p style="margin:0;font-size:1rem;color:rgba(226,232,240,0.88);">Manage clients, policies, and SAML SPs with a familiar Google/Entra-inspired UI.</p>
        </div>
      </div>
    </header>

    <div class="grid">
      <article class="panel">
        <div class="topbar">
          <button type="button" class="secondary theme-toggle" data-theme-toggle onclick="window.solutrixToggleTheme?.()">
            <span class="icon" aria-hidden="true">☀️</span>
            <span class="sr-only">Toggle theme</span>
          </button>
        </div>
        <div class="row">
          <div>
            <label for="resource">Resource</label>
            <select id="resource">
              <option value="clients">Clients</option>
              <option value="policies">Policies</option>
              <option value="sps">Service Providers</option>
            </select>
          </div>
          <div>
            <label for="operation">Operation</label>
            <select id="operation">
              <option value="list">List</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
            </select>
          </div>
          <div>
            <label for="recordId">Record ID (for update/delete)</label>
            <input id="recordId" placeholder="UUID / database id" />
          </div>
        </div>

        <div id="form-clients" class="">
          <div class="row">
            <div><label>Name</label><input id="client_name" placeholder="example-app" /></div>
            <div><label>Client Secret (optional for update)</label><input id="client_secret" placeholder="auto if empty" /></div>
          </div>
          <label>Redirect URIs (one per line)</label>
          <textarea id="client_redirects" placeholder="http://localhost:3000/callback"></textarea>
          <label>Post-logout Redirect URIs (one per line)</label>
          <textarea id="client_post_logout" placeholder="http://localhost:5173/"></textarea>
          <label>Grant Types (one per line)</label>
          <textarea id="client_grants" placeholder="authorization_code&#10;refresh_token"></textarea>
          <label>Scopes (one per line)</label>
          <textarea id="client_scopes" placeholder="openid&#10;profile&#10;email"></textarea>
        </div>

        <div id="form-policies" class="hidden">
          <div class="row">
            <div><label>Name</label><input id="policy_name" placeholder="require-2fa" /></div>
            <div><label>Target Type</label><input id="policy_target_type" placeholder="client|user|service" /></div>
            <div><label>Target ID (optional)</label><input id="policy_target_id" placeholder="client-id or user-id" /></div>
          </div>
          <label>Policy JSON</label>
          <textarea id="policy_body" placeholder='{\"rule\":\"allow\"}'></textarea>
        </div>

        <div id="form-sps" class="hidden">
          <div class="row">
            <div><label>Entity ID</label><input id="sp_entity" placeholder="urn:example:sp" /></div>
            <div><label>Binding</label><input id="sp_binding" placeholder="post|redirect" /></div>
          </div>
          <label>ACS Endpoints (one per line)</label>
          <textarea id="sp_acs" placeholder="https://app.example.com/saml/acs"></textarea>
          <label>Metadata XML (optional)</label>
          <textarea id="sp_metadata" placeholder="<EntityDescriptor>...</EntityDescriptor>"></textarea>
          <label>Attribute Mapping JSON</label>
          <textarea id="sp_attrs" placeholder='{\"email\":\"mail\",\"name\":\"displayName\"}'></textarea>
        </div>

        <div class="row" style="align-items:center;margin-top:12px;">
          <div>
            <label for="username">MASTER_USER</label>
            <input id="username" value="${escapeHtml(masterUser)}" />
          </div>
          <div>
            <label for="password">MASTER_PASSWORD</label>
            <input id="password" type="password" placeholder="Enter master password" />
          </div>
          <div style="align-self:flex-end;">
            <button id="run">Run</button>
          </div>
        </div>
      </article>

      <article class="panel">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;">
          <div>
            <p style="margin:0;font-weight:700;letter-spacing:0.08em;font-size:12px;" class="muted">Result</p>
            <h3 style="margin:2px 0;">API Response</h3>
          </div>
          <span class="muted">Requests hit /gui/api (master auth).</span>
        </div>
        <pre id="output">Awaiting action...</pre>
      </article>
    </div>
  </div>
  <script>
    const resource = document.getElementById('resource');
    const operation = document.getElementById('operation');
    const recordId = document.getElementById('recordId');
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    const output = document.getElementById('output');
    const runBtn = document.getElementById('run');

    const forms = {
      clients: document.getElementById('form-clients'),
      policies: document.getElementById('form-policies'),
      sps: document.getElementById('form-sps'),
    };

    const showForm = () => {
      const res = resource.value;
      Object.entries(forms).forEach(([key, el]) => {
        if (el) el.classList.toggle('hidden', key !== res);
      });
    };
    resource.addEventListener('change', showForm);
    showForm();

    const setOutput = (value) => {
      output.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    };

    const buildAuthHeader = () => {
      const u = username.value || '';
      const p = password.value || '';
      return 'Basic ' + btoa(u + ':' + p);
    };

    const splitLines = (value) => value.split(/\\r?\\n/).map((v) => v.trim()).filter(Boolean);

    const buildPayload = () => {
      const res = resource.value;
      if (res === 'clients') {
        const redirects = splitLines(document.getElementById('client_redirects').value);
        const postLogout = splitLines(document.getElementById('client_post_logout').value);
        const grants = splitLines(document.getElementById('client_grants').value);
        const scopes = splitLines(document.getElementById('client_scopes').value);
        const payload = {
          name: document.getElementById('client_name').value.trim() || undefined,
          client_secret: document.getElementById('client_secret').value.trim() || undefined,
          redirect_uris: redirects,
          post_logout_redirect_uris: postLogout,
          grant_types: grants,
          scopes,
        };
        Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
        return payload;
      }
      if (res === 'policies') {
        let policyJson = {};
        const raw = document.getElementById('policy_body').value.trim();
        if (raw) {
          try { policyJson = JSON.parse(raw); } catch (err) { throw new Error('Policy JSON invalid: ' + err); }
        }
        const payload = {
          name: document.getElementById('policy_name').value.trim() || undefined,
          target_type: document.getElementById('policy_target_type').value.trim() || undefined,
          target_id: document.getElementById('policy_target_id').value.trim() || undefined,
          policy: policyJson,
        };
        Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
        return payload;
      }
      if (res === 'sps') {
        let attrMap = {};
        const attrsRaw = document.getElementById('sp_attrs').value.trim();
        if (attrsRaw) {
          try { attrMap = JSON.parse(attrsRaw); } catch (err) { throw new Error('Attribute mapping JSON invalid: ' + err); }
        }
        const payload = {
          entity_id: document.getElementById('sp_entity').value.trim() || undefined,
          binding: document.getElementById('sp_binding').value.trim() || undefined,
          acs: splitLines(document.getElementById('sp_acs').value),
          metadata_xml: document.getElementById('sp_metadata').value.trim() || undefined,
          attr_mapping: attrMap,
        };
        Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
        return payload;
      }
      return {};
    };

    const callApi = async () => {
      const res = resource.value;
      const op = operation.value;
      const id = recordId.value.trim();
      let method = 'GET';
      let path = '/gui/api/' + res;
      let body;

      if (op === 'create') { method = 'POST'; body = buildPayload(); }
      if (op === 'update') { method = 'PUT'; path += id ? '/' + encodeURIComponent(id) : ''; body = buildPayload(); }
      if (op === 'delete') { method = 'DELETE'; path += id ? '/' + encodeURIComponent(id) : ''; }

      if ((op === 'update' || op === 'delete') && !id) {
        setOutput({ error: 'Record ID is required for update/delete' });
        return;
      }

      try {
        const response = await fetch(path, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': buildAuthHeader(),
          },
          body: body ? JSON.stringify(body) : undefined,
        });
        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch { data = text; }
        setOutput({ status: response.status, data });
      } catch (err) {
        setOutput({ error: 'Request failed', details: String(err) });
      }
    };

    runBtn.addEventListener('click', (e) => {
      e.preventDefault();
      try {
        callApi();
      } catch (err) {
        setOutput({ error: String(err) });
      }
    });

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
  </script>
</body>
</html>`;
