# Solutrix Identity Provider (IDP)

Solutrix IDP is an OpenID Connect (OIDC 1.0) / OAuth 2.0 authorization server built on `oidc-provider`, hosted via Express, and backed by PostgreSQL (Sequelize). It authenticates end-users against WildDuck and issues standards-based tokens to first- and third-party clients.

This README focuses on how the IDP works internally (auth flow, client model, policies/SP registries) and how to operate it as a developer.

## High-Level Architecture

```text
┌───────────────────────────┐
│ Relying Party (web/mobile)│
└──────────────┬────────────┘
               │ 1) /oauth/authorize (PKCE)
               ▼
┌───────────────────────────┐
│ Solutrix IDP (Express)     │
│ - oidc-provider (OIDC)     │
│ - /interaction/:uid (UI)   │
│ - /api/global/admin (CRUD) │
└───────┬───────────┬───────┘
        │           │
        │           ├─ PostgreSQL (Sequelize)
        │           │  - oidc_adapter_store (oidc-provider)
        │           │  - oidc_clients
        │           │  - jwt_rsa256_keys
        │           │  - identity_policies (WIP)
        │           │  - saml_service_providers (WIP)
        │           │  - token_exchange_* (internal)
        │
        └─ WildDuck API (user auth + profile)
           - credential verification
           - account lookup for claims
```

Key entry points:
- Express bootstrap: `src/server.ts`
- OIDC provider configuration: `src/oidc/provider.ts`
- Interaction (login/consent) controller: `src/controllers/authController.ts`
- Admin API controller: `src/controllers/adminController.ts`

## OIDC/OAuth Endpoints

The provider routes are configured in `src/oidc/provider.ts`:
- Authorization: `GET /oauth/authorize`
- Token: `POST /oauth/token`
- JWKS: `GET /oauth/jwks.json`
- UserInfo: `GET /userinfo`
- Introspection: `POST /oauth/introspect`
- Revocation: `POST /oauth/revoke`
- End-session: `GET /oauth/logout`

Standard discovery endpoints (served by `oidc-provider`) are also available under `/.well-known/openid-configuration` (issuer-dependent).

## Interaction (Login + Consent) Flow (Authorization Code + PKCE)

### 1) Client starts authorization

Your relying party redirects the user to:

```
GET /oauth/authorize
  ?client_id=...
  &redirect_uri=...
  &response_type=code
  &scope=openid%20profile%20email%20offline_access
  &code_challenge=...
  &code_challenge_method=S256
  &state=...
```

PKCE is required (`S256`) by configuration.

### 2) `oidc-provider` redirects into an interaction

When user authentication/consent is required, `oidc-provider` creates an interaction and redirects the browser to:

```
GET /interaction/:uid
```

That route is served by Express (`src/routes/authRoutes.ts`) and implemented in `src/controllers/authController.ts`.

### 3) `GET /interaction/:uid` renders either login or consent

`showInteraction` calls `provider.interactionDetails(req, res)` and inspects `interaction.prompt.name`:

- `login` → renders the login page.
- `consent` → renders the consent page (lists requested scopes).
- any other prompt → attempts to finish the interaction automatically if possible.

The HTML is rendered from view components:
- Login page: `src/views/interaction/loginPage.ts`
- Consent page: `src/views/interaction/consentPage.ts`

### 4) `POST /interaction/:uid/login` authenticates against WildDuck

`login_wd` expects a form submission with:
- `username` (email)
- `password`
- `uid` (hidden field)

Flow:
1. Ensures the interaction cookie exists (in some dev cases the controller re-seeds it to recover from missing cookies).
2. Calls WildDuck to validate credentials.
3. Fetches the WildDuck account profile.
4. Updates WildDuck metadata (login timestamp, client context, etc.).
5. Finishes the interaction via `provider.interactionFinished(...)` with:
   - `accountId` (WildDuck user id)
   - `acr` / `amr` describing the authentication method

### 5) Consent approval/denial

The consent page posts to:
- Approve: `POST /interaction/:uid/confirm`
- Deny: `POST /interaction/:uid/abort`

Approving consent creates/updates an `oidc-provider` Grant (adds scopes/claims/resource scopes) and then finishes the interaction.

### 6) Token exchange (authorization code → tokens)

After successful interaction, the browser is redirected back to the client `redirect_uri` with `?code=...`.

The client then calls the token endpoint:

```bash
curl -u "$CLIENT_ID:$CLIENT_SECRET" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "grant_type=authorization_code" \
  -d "code=$CODE" \
  -d "redirect_uri=$REDIRECT_URI" \
  -d "code_verifier=$CODE_VERIFIER" \
  http://localhost:8080/oauth/token
```

### 7) Claims and user lookup

When issuing ID/access tokens and serving `/userinfo`, `oidc-provider` resolves accounts via `findAccount` (WildDuck lookup). Claims are constructed in `src/services/wildduckUserService.ts` and influenced by provider config in `src/oidc/provider.ts` (scopes/claims mapping).

## Clients (OIDC Relying Parties)

### Where clients live

Clients are primarily stored in Postgres (`oidc_clients` table) and loaded at IDP startup:
- DB-backed clients: loaded by `fetchDbClients()` in `src/oidc/provider.ts`
- Static fallback clients (optional): via `OIDC_CLIENTS_JSON` or `OIDC_DEFAULT_*` env vars

### What a client contains

The DB record stores:
- `clientId` / `clientSecret`
- `redirectUris[]`
- `postLogoutRedirectUris[]` (optional)
- `grantTypes[]` (must match what `oidc-provider` supports)
- `scopes[]` (stored as an allowlist; exposed to `oidc-provider` via `scope` string)

### How admin updates affect runtime behavior

Admin CRUD operations also synchronize the `oidc-provider` internal client registry (including cache refresh), so changes take effect without restarting the server.

## Identity Policies (WIP)

Identity policies are stored and manageable via the Admin API (`identity_policies` table), but they are not yet a hard enforcement mechanism in the core OIDC login/consent flow.

Current state:
- CRUD is implemented (`/api/global/admin/policies`).
- The schema is intentionally flexible (`policy` is a JSON blob).
- Enforcement is expected to evolve (e.g., token exchange constraints, per-client rules, service gating).

If you need strict enforcement today, you should implement it explicitly in:
- the token exchange grant implementation (`src/oidc/tokenExchange.ts`), and/or
- resource servers (APIs) consuming the access token.

## SAML Service Providers (WIP)

The Admin API exposes CRUD for a SAML SP registry (`saml_service_providers` table):
- entity id
- ACS endpoints
- binding
- optional metadata XML
- attribute mapping (JSON)

Current state:
- This is a registry only (no SAML SSO endpoints are implemented in the IDP yet).
- Treat these endpoints and schema as work-in-progress.

## Signing Keys (JWKS / RS256)

`oidc-provider` signs tokens using RS256 keys stored in the database (`jwt_rsa256_keys`).

Important:
- The server will fail to start if no active signing key exists.
- Rotate/generate keys via the Admin API endpoint: `POST /api/global/admin/keys/rotate`.

## Admin API

### Authentication

All admin endpoints under `/api/global/admin/*` are protected by an API key:
- `ADMIN_API_KEY` (required)
- `ADMIN_API_KEY_HEADER` (optional, defaults to `x-admin-api-key`)

Example:

```bash
export IDP_BASE="http://localhost:8080"
export ADMIN_API_KEY="change-me"
export ADMIN_API_KEY_HEADER="x-admin-api-key"
```

Then call:

```bash
curl -H "$ADMIN_API_KEY_HEADER: $ADMIN_API_KEY" "$IDP_BASE/api/global/admin/clients"
```

### Common Operations

#### Create client

```bash
curl -X POST "$IDP_BASE/api/global/admin/clients" \
  -H "$ADMIN_API_KEY_HEADER: $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "example-app",
    "redirect_uris": ["http://localhost:3000/callback"],
    "post_logout_redirect_uris": ["http://localhost:3000/"],
    "grant_types": ["authorization_code","refresh_token"],
    "scopes": ["openid","profile","email","offline_access"]
  }'
```

Notes:
- Response includes `client_secret` only on create (and on rotate).
- `GET` and `LIST` omit secrets by design.

#### Update client (rotate secret)

```bash
curl -X PUT "$IDP_BASE/api/global/admin/clients/$DB_ID" \
  -H "$ADMIN_API_KEY_HEADER: $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "rotate_secret": true
  }'
```

#### Create policy (WIP)

```bash
curl -X POST "$IDP_BASE/api/global/admin/policies" \
  -H "$ADMIN_API_KEY_HEADER: $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "example-policy",
    "target_type": "client",
    "target_id": "optional-target",
    "policy": {
      "note": "schema is WIP"
    }
  }'
```

#### Create SAML SP (WIP)

```bash
curl -X POST "$IDP_BASE/api/global/admin/sps" \
  -H "$ADMIN_API_KEY_HEADER: $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "entity_id": "urn:example:sp",
    "acs": ["https://sp.example.com/saml/acs"],
    "binding": "post",
    "attr_mapping": { "email": "mail" }
  }'
```

#### Rotate signing key

```bash
curl -X POST "$IDP_BASE/api/global/admin/keys/rotate" \
  -H "$ADMIN_API_KEY_HEADER: $ADMIN_API_KEY"
```

### Endpoint Summary

Clients:
- `GET /api/global/admin/clients`
- `GET /api/global/admin/clients/:id`
- `POST /api/global/admin/clients`
- `PUT /api/global/admin/clients/:id`
- `DELETE /api/global/admin/clients/:id`

Policies (WIP):
- `GET /api/global/admin/policies`
- `GET /api/global/admin/policies/:id`
- `POST /api/global/admin/policies`
- `PUT /api/global/admin/policies/:id`
- `DELETE /api/global/admin/policies/:id`

SAML SPs (WIP):
- `GET /api/global/admin/sps`
- `GET /api/global/admin/sps/:id`
- `POST /api/global/admin/sps`
- `PUT /api/global/admin/sps/:id`
- `DELETE /api/global/admin/sps/:id`

Keys:
- `POST /api/global/admin/keys/rotate`

## Admin GUI (Dev-Only)

The Admin GUI is a lightweight HTML tool for development/testing that calls the same admin routes via `/gui/api/*`.

Enable/disable:
- `ENABLE_GUI=true` enables:
  - `GET /gui` (HTML UI)
  - `/gui/api/*` (admin API behind Basic auth)
- `ENABLE_GUI=false` disables it entirely (recommended for production).

Authentication:
- HTTP Basic auth via `MASTER_USER` + `MASTER_PASSWORD`

How to use:
1. Set `ENABLE_GUI=true`, `MASTER_USER`, `MASTER_PASSWORD`.
2. Open `http://localhost:8080/gui`.
3. Enter master credentials, choose resource + operation, click Run.

Security notes:
- Do not expose `/gui` to the public internet.
- Treat it as a dev convenience, not a production admin surface.

## OpenAPI / Swagger UI

The OpenAPI spec is stored as a static artifact:
- Source file: `public/openapi.json`
- Served as JSON: `GET /docs.json`
- Swagger UI: `GET /docs`

## Configuration (Environment Variables)

Required for a typical dev setup:
- `DATABASE_URL` (PostgreSQL connection string)
- `WD_API_URL`, `WD_API_KEY` (WildDuck API access)
- `ADMIN_API_KEY` (admin API authentication)
- at least one signing key row in `jwt_rsa256_keys` (or rotate one via admin endpoint)

Common optional variables:
- `PORT` (default: `8080`)
- `HOST` (default: `0.0.0.0`)
- `OIDC_ISSUER` (defaults to `http://localhost:$PORT`)
- `OIDC_COOKIE_KEYS` (comma-separated; used to sign cookies)
- `CORS_ORIGINS` (comma-separated list; unset disables CORS)
- `ADMIN_API_KEY_HEADER` (default: `x-admin-api-key`)
- `ENABLE_GUI` (default: `false`)
- `MASTER_USER`, `MASTER_PASSWORD` (required if GUI is enabled)

Reference: `.template.env`

## Development

```bash
npm run migrate
npm run dev
```

Typecheck only:

```bash
./node_modules/.bin/tsc -p tsconfig.json --noEmit
```

Docs:
- `http://localhost:8080/docs` (Swagger UI)
- `http://localhost:8080/.well-known/openid-configuration` (OIDC discovery)

