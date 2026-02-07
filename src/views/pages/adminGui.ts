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
      width: min(1280px, 100%);
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

    @media (min-width: 1080px) {
      .grid {
        grid-template-columns: 6fr 5fr;
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

    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 12px;
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

    table {
      width: 100%;
      border-collapse: collapse;
    }

    table tr {
      cursor: pointer;
    }

    table tr.selected {
      background: rgba(15, 111, 255, 0.08);
    }

    table th, table td {
      border-bottom: 1px solid var(--panel-border);
      padding: 10px 8px;
      vertical-align: top;
    }

    .table-wrapper {
      overflow-x: auto;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(15, 111, 255, 0.08);
      color: #0f3e9c;
      font-weight: 600;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <dialog id="secretModal">
    <article>
      <header>
        <h3>Copy client credentials</h3>
      </header>
      <p class="muted">Store this client_id and client_secret now. The secret cannot be retrieved later.</p>
      <pre id="secretContent" class="text-xs"></pre>
      <footer>
        <button id="closeSecret" class="secondary">Close</button>
      </footer>
    </article>
  </dialog>
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
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
            <label for="resource" style="margin:0;">Resource</label>
            <select id="resource">
              <option value="clients">Clients</option>
              <option value="policies">Policies</option>
              <option value="sps">Service Providers</option>
            </select>
            <button type="button" id="listBtn" class="secondary">List</button>
            <button type="button" id="createBtn">Create new</button>
          </div>
          <button type="button" class="secondary theme-toggle" data-theme-toggle onclick="window.solutrixToggleTheme?.()">
            <span class="icon" aria-hidden="true">☀️</span>
            <span class="sr-only">Toggle theme</span>
          </button>
        </div>

        <div class="row" style="margin-bottom:8px;">
          <div>
            <label for="username">MASTER_USER</label>
            <input id="username" value="${escapeHtml(masterUser)}" />
          </div>
          <div>
            <label for="password">MASTER_PASSWORD</label>
            <input id="password" type="password" placeholder="Enter master password" />
          </div>
          <div>
            <label for="status">Status</label>
            <input id="status" readonly value="Ready" />
          </div>
        </div>

        <div id="form-clients" class="">
          <p class="muted" id="mode-clients">Mode: Create</p>
          <div class="row">
            <div><label for="client_name">Name</label><input id="client_name" placeholder="example-app" /></div>
            <div><label for="client_secret">Client Secret (optional for update)</label><input id="client_secret" placeholder="leave blank to keep" /></div>
          </div>
          <label for="client_redirects">Redirect URIs (one per line)</label>
          <textarea id="client_redirects" placeholder="http://localhost:3000/callback"></textarea>
          <label for="client_post_logout">Post-logout Redirect URIs (one per line)</label>
          <textarea id="client_post_logout" placeholder="http://localhost:5173/"></textarea>
          <label for="client_grants">Grant Types (one per line)</label>
          <textarea id="client_grants" placeholder="authorization_code&#10;refresh_token"></textarea>
          <label for="client_scopes">Scopes (one per line)</label>
          <textarea id="client_scopes" placeholder="openid&#10;profile&#10;email"></textarea>
        </div>

        <div id="form-policies" class="hidden">
          <p class="muted" id="mode-policies">Mode: Create</p>
          <div class="row">
            <div><label for="policy_name">Name</label><input id="policy_name" placeholder="require-2fa" /></div>
            <div><label for="policy_target_type">Target Type</label><input id="policy_target_type" placeholder="client|user|service" /></div>
            <div><label for="policy_target_id">Target ID (optional)</label><input id="policy_target_id" placeholder="client-id or user-id" /></div>
          </div>
          <label for="policy_body">Policy JSON</label>
          <textarea id="policy_body" placeholder='{\"rule\":\"allow\"}'></textarea>
        </div>

        <div id="form-sps" class="hidden">
          <p class="muted" id="mode-sps">Mode: Create</p>
          <div class="row">
            <div><label for="sp_entity">Entity ID</label><input id="sp_entity" placeholder="urn:example:sp" /></div>
            <div><label for="sp_binding">Binding</label><input id="sp_binding" placeholder="post|redirect" /></div>
          </div>
          <label for="sp_acs">ACS Endpoints (one per line)</label>
          <textarea id="sp_acs" placeholder="https://app.example.com/saml/acs"></textarea>
          <label for="sp_metadata">Metadata XML (optional)</label>
          <textarea id="sp_metadata" placeholder="<EntityDescriptor>...</EntityDescriptor>"></textarea>
          <label for="sp_attrs">Attribute Mapping JSON</label>
          <textarea id="sp_attrs" placeholder='{\"email\":\"mail\",\"name\":\"displayName\"}'></textarea>
        </div>

        <div class="row" style="align-items:center;margin-top:12px;">
          <div>
            <button id="saveBtn">Save</button>
          </div>
          <div>
            <button class="secondary" id="deleteBtn">Delete selected</button>
          </div>
        </div>
      </article>

      <article class="panel">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;">
          <div>
            <p style="margin:0;font-weight:700;letter-spacing:0.08em;font-size:12px;" class="muted">Listing</p>
            <h3 style="margin:2px 0;">Records</h3>
          </div>
          <span class="muted">Click a row to edit. Requests hit /gui/api (master auth).</span>
        </div>
        <div class="table-wrapper">
          <table id="listTable">
            <thead id="listHead"></thead>
            <tbody id="listBody"></tbody>
          </table>
        </div>
        <div style="margin-top:12px;">
          <pre id="output">Awaiting action...</pre>
        </div>
        <div id="secretInline" class="hidden" style="margin-top:12px;">
          <div class="alert">
            <strong>Copy these credentials now:</strong>
            <pre id="secretInlineContent" class="text-xs"></pre>
          </div>
        </div>
      </article>
    </div>
  </div>
  <script>
    const resource = document.getElementById('resource');
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    const statusEl = document.getElementById('status');
    const output = document.getElementById('output');
    const listHead = document.getElementById('listHead');
    const listBody = document.getElementById('listBody');
    const listBtn = document.getElementById('listBtn');
    const createBtn = document.getElementById('createBtn');
    const saveBtn = document.getElementById('saveBtn');
    const deleteBtn = document.getElementById('deleteBtn');

    const forms = {
      clients: document.getElementById('form-clients'),
      policies: document.getElementById('form-policies'),
      sps: document.getElementById('form-sps'),
    };

    const modes = {
      clients: document.getElementById('mode-clients'),
      policies: document.getElementById('mode-policies'),
      sps: document.getElementById('mode-sps'),
    };

    const state = {
      resource: resource.value,
      selection: null,
      data: [],
    };

    const showForm = () => {
      const res = state.resource;
      Object.entries(forms).forEach(([key, el]) => {
        if (el) el.classList.toggle('hidden', key !== res);
      });
      Object.entries(modes).forEach(([key, el]) => {
        if (el) el.textContent = \`Mode: \${state.selection && state.resource === key ? 'Edit' : 'Create'}\`;
      });
    };
    resource.addEventListener('change', () => {
      state.resource = resource.value;
      state.selection = null;
      setStatus('Ready');
      clearForm();
      renderTable();
      showForm();
    });
    showForm();

    const setOutput = (value) => {
      output.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    };

    const setStatus = (text) => {
      statusEl.value = text;
    };

    const buildAuthHeader = () => {
      const u = username.value || '';
      const p = password.value || '';
      return 'Basic ' + btoa(u + ':' + p);
    };

    const splitLines = (value) => value.split(/\\r?\\n/).map((v) => v.trim()).filter(Boolean);
    const joinLines = (arr) => Array.isArray(arr) ? arr.join('\\n') : '';

    const clearForm = () => {
      if (state.resource === 'clients') {
        document.getElementById('client_name').value = '';
        document.getElementById('client_secret').value = '';
        document.getElementById('client_redirects').value = '';
        document.getElementById('client_post_logout').value = '';
        document.getElementById('client_grants').value = '';
        document.getElementById('client_scopes').value = '';
      }
      if (state.resource === 'policies') {
        document.getElementById('policy_name').value = '';
        document.getElementById('policy_target_type').value = '';
        document.getElementById('policy_target_id').value = '';
        document.getElementById('policy_body').value = '';
      }
      if (state.resource === 'sps') {
        document.getElementById('sp_entity').value = '';
        document.getElementById('sp_binding').value = '';
        document.getElementById('sp_acs').value = '';
        document.getElementById('sp_metadata').value = '';
        document.getElementById('sp_attrs').value = '';
      }
      state.selection = null;
      showForm();
    };

    const fillForm = (item) => {
      if (state.resource === 'clients') {
        document.getElementById('client_name').value = item.name || '';
        document.getElementById('client_secret').value = '';
        document.getElementById('client_redirects').value = joinLines(item.redirectUris || item.redirect_uris || []);
        document.getElementById('client_post_logout').value = joinLines(item.postLogoutRedirectUris || item.post_logout_redirect_uris || []);
        document.getElementById('client_grants').value = joinLines(item.grantTypes || item.grant_types || []);
        document.getElementById('client_scopes').value = joinLines(item.scopes || []);
      }
      if (state.resource === 'policies') {
        document.getElementById('policy_name').value = item.name || '';
        document.getElementById('policy_target_type').value = item.targetType || item.target_type || '';
        document.getElementById('policy_target_id').value = item.targetId || item.target_id || '';
        document.getElementById('policy_body').value = item.policy ? JSON.stringify(item.policy, null, 2) : '';
      }
      if (state.resource === 'sps') {
        document.getElementById('sp_entity').value = item.entityId || item.entity_id || '';
        document.getElementById('sp_binding').value = item.binding || '';
        document.getElementById('sp_acs').value = joinLines(item.acsEndpoints || item.acs || item.acs_endpoints || []);
        document.getElementById('sp_metadata').value = item.metadataXml || item.metadata_xml || '';
        document.getElementById('sp_attrs').value = item.attributeMapping
          ? JSON.stringify(item.attributeMapping, null, 2)
          : item.attr_mapping
          ? JSON.stringify(item.attr_mapping, null, 2)
          : '';
      }
      state.selection = item;
      showForm();
    };

    const buildPayload = () => {
      if (state.resource === 'clients') {
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
      if (state.resource === 'policies') {
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
      if (state.resource === 'sps') {
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

    const apiFetch = async (path, options = {}) => {
      const resp = await fetch(path, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': buildAuthHeader(),
          ...(options.headers || {}),
        },
      });
      const text = await resp.text();
      let parsed;
      try { parsed = JSON.parse(text); } catch { parsed = text; }
      return { resp, parsed };
    };

    const loadList = async () => {
      setStatus('Loading...');
      const { resp, parsed } = await apiFetch('/gui/api/' + state.resource);
      if (!resp.ok) {
        setStatus('List failed');
        setOutput(parsed);
        return;
      }
      state.data = Array.isArray(parsed) ? parsed : [];
      setStatus(\`Loaded \${state.data.length}\`);
      renderTable();
      setOutput({ status: resp.status, count: state.data.length });
    };

    const renderTable = () => {
      listHead.innerHTML = '';
      listBody.innerHTML = '';
      const data = state.data || [];
      if (data.length === 0) {
        listBody.innerHTML = '<tr><td colspan="4">No records.</td></tr>';
        return;
      }
      const keys = Object.keys(data[0]).filter((k) => !['clientSecret', 'createdAt', 'updatedAt'].includes(k)).slice(0, 6);
      const headRow = document.createElement('tr');
      headRow.innerHTML = '<th>id</th>' + keys.map((k) => '<th>' + k + '</th>').join('');
      listHead.appendChild(headRow);

      data.forEach((item) => {
        const tr = document.createElement('tr');
        tr.dataset.id = item.id;
        tr.innerHTML = '<td><span class="pill">' + (item.id || '').toString().slice(0, 8) + '</span></td>' +
          keys.map((k) => '<td>' + formatCell(item[k]) + '</td>').join('');
        if (state.selection && state.selection.id === item.id) {
          tr.classList.add('selected');
        }
        tr.addEventListener('click', () => {
          state.selection = item;
          fillForm(item);
          highlightSelection();
        });
        listBody.appendChild(tr);
      });
    };

    const formatCell = (value) => {
      if (Array.isArray(value)) {
        return value.join(", ");
      }
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      return value === undefined || value === null ? '' : String(value);
    };

    const highlightSelection = () => {
      [...listBody.querySelectorAll('tr')].forEach((tr) => {
        tr.classList.toggle('selected', state.selection && tr.dataset.id === state.selection.id);
      });
    };

    listBtn.addEventListener('click', () => {
      state.selection = null;
      clearForm();
      loadList().catch((err) => {
        setStatus('List failed');
        setOutput(String(err));
      });
    });

    createBtn.addEventListener('click', () => {
      clearForm();
      setStatus('Create mode');
      setOutput('Ready to create');
    });

    saveBtn.addEventListener('click', async () => {
      try {
        const payload = buildPayload();
        const id = state.selection?.id;
        const isEdit = Boolean(id);
        const path = '/gui/api/' + state.resource + (isEdit ? '/' + encodeURIComponent(id) : '');
        const method = isEdit ? 'PUT' : 'POST';
        setStatus(isEdit ? 'Updating...' : 'Creating...');
        const { resp, parsed } = await apiFetch(path, { method, body: JSON.stringify(payload) });
        setOutput(parsed);
        if (!resp.ok) {
          setStatus(isEdit ? 'Update failed' : 'Create failed');
          return;
        }
        setStatus(isEdit ? 'Updated' : 'Created');
        if (!isEdit && parsed?.client_id && parsed?.client_secret) {
          showSecretModal(parsed.client_id, parsed.client_secret);
        }
        state.selection = null;
        clearForm();
        await loadList();
      } catch (err) {
        setStatus('Save error');
        setOutput(String(err));
      }
    });

    deleteBtn.addEventListener('click', async () => {
      if (!state.selection) {
        setOutput('Select a record first');
        return;
      }
      const id = state.selection.id;
      setStatus('Deleting...');
      const { resp, parsed } = await apiFetch('/gui/api/' + state.resource + '/' + encodeURIComponent(id), { method: 'DELETE' });
      setOutput(parsed || { status: resp.status });
      if (!resp.ok && resp.status !== 204) {
        setStatus('Delete failed');
        return;
      }
      setStatus('Deleted');
      state.selection = null;
      clearForm();
      await loadList();
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

    const secretModal = document.getElementById('secretModal');
    const secretContent = document.getElementById('secretContent');
    const closeSecret = document.getElementById('closeSecret');
    const secretInline = document.getElementById('secretInline');
    const secretInlineContent = document.getElementById('secretInlineContent');

    const showSecretModal = (clientId, clientSecret) => {
      if (!secretModal || !secretContent) return;
      const payload = { client_id: clientId, client_secret: clientSecret };
      secretContent.textContent = JSON.stringify(payload, null, 2);
      if (secretInline && secretInlineContent) {
        secretInlineContent.textContent = JSON.stringify(payload, null, 2);
        secretInline.classList.remove('hidden');
      }

      if (typeof secretModal.showModal === "function") {
        secretModal.showModal();
      } else {
        secretModal.removeAttribute('open');
        secretModal.setAttribute('open', 'true');
      }
    };

    if (closeSecret && secretModal) {
      const close = () => {
        if (typeof secretModal.close === "function") {
          secretModal.close();
        } else {
          secretModal.removeAttribute('open');
        }
        if (secretInline) {
          secretInline.classList.add('hidden');
        }
      };
      closeSecret.addEventListener('click', close);
    }
  </script>
</body>
</html>`;
