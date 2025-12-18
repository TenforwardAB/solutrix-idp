import { escapeHtml } from "../html.js";

export const renderAdminGuiPage = (masterUser: string): string => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Solutrix IDP Admin GUI</title>
  <style>
    :root { color-scheme: light; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
    body { margin: 0; background: #f7f9fc; color: #0f172a; }
    header { background: linear-gradient(135deg, #0ea5e9, #6366f1); color: #fff; padding: 20px 28px; box-shadow: 0 4px 18px rgba(0,0,0,0.12); }
    main { max-width: 1100px; margin: 20px auto; padding: 0 20px 40px; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; box-shadow: 0 10px 30px rgba(15,23,42,0.08); padding: 20px; }
    label { display: block; font-weight: 600; margin: 12px 0 6px; }
    input, select, textarea { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 14px; background: #f8fafc; }
    textarea { min-height: 120px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; }
    button { background: linear-gradient(135deg, #0ea5e9, #6366f1); color: #fff; border: none; padding: 12px 16px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: transform 0.1s ease, box-shadow 0.2s ease; }
    button:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(99,102,241,0.35); }
    pre { background: #0f172a; color: #e2e8f0; padding: 14px; border-radius: 12px; overflow-x: auto; border: 1px solid #1e293b; }
    .row { display: grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap: 14px; }
    .muted { color: #475569; font-size: 13px; }
    .badge { display: inline-block; padding: 4px 8px; background: #e2e8f0; border-radius: 999px; font-size: 12px; font-weight: 600; }
    .hidden { display: none; }
  </style>
</head>
<body>
  <header>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;">
      <div>
        <div class="badge">DEV GUI</div>
        <h1 style="margin:6px 0 2px;font-size:22px;">Solutrix IDP Admin</h1>
        <p style="margin:0;font-size:14px;opacity:0.88;">Manage Clients, Policies, and SAML SPs.</p>
      </div>
      <div style="text-align:right;font-size:12px;opacity:0.85;">Protected by MASTER_USER / MASTER_PASSWORD</div>
    </div>
  </header>
  <main>
    <div class="card" id="panel">
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
    </div>

    <div style="margin-top:20px;" class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;">
        <h3 style="margin:0;">Result</h3>
        <div class="muted">Requests hit /gui/api (master auth).</div>
      </div>
      <pre id="output">Awaiting action...</pre>
    </div>
  </main>
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
  </script>
</body>
</html>`;
