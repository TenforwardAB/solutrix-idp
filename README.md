# Solutrix Identity Provider

Solutrix IDP is a TypeScript/Node.js implementation of an **OpenID Connect (OIDC) 1.0** and **OAuth 2.0** provider. It is designed to sit in front of the Solutrix WildDuck mail platform and issue standards-based tokens for first- and third-party applications. The service is built on top of [`oidc-provider`](https://github.com/panva/node-oidc-provider), Express, and Sequelize (PostgreSQL), and exposes a RESTful admin API for managing OIDC clients, SAML service providers, and authorization policies.

The project is tuned for local development: it supports PKCE, automatically looks up WildDuck accounts for claims, and ships with migration scripts, type-safe models, and container manifests.

---

## Contents

1. [Architecture Overview](#architecture-overview)
2. [Key Features](#key-features)
3. [Supported Grants, Scopes & Claims](#supported-grants-scopes--claims)
4. [Environment & Configuration](#environment--configuration)
5. [Running Locally](#running-locally)
6. [Admin API Quick Reference](#admin-api-quick-reference)
7. [Authorization Flow Walkthrough](#authorization-flow-walkthrough)
8. [Integrating from a TypeScript or Svelte App](#integrating-from-a-typescript-or-svelte-app)
9. [Troubleshooting](#troubleshooting)
10. [Further Reading](#further-reading)

---

## Architecture Overview

```text
┌─────────────┐      ┌───────────────┐     ┌─────────────────────┐
│  Front-end  │─────▶│  Solutrix IDP │────▶│ WildDuck User Store │
│  (SPA/app)  │◀────┘│  (this repo)  │◀──┐ │  (REST via SDK)     │
└─────────────┘      ├───────────────┤   │ └─────────────────────┘
                     │ oidc-provider │   │
                     │ Express API   │   │ ┌──────────────────────┐
                     │ Sequelize DB  │   └▶│ PostgreSQL (oidc_* ) │
                     └───────────────┘     └──────────────────────┘
```

- **oidc-provider**: Handles the OIDC/OAuth protocol, token issuance, and session storage.
- **Express**: Hosts admin APIs (`/api/global/admin/*`) and interaction routes (`/interaction/:uid`).
- **Sequelize**: Persists signing keys, clients, interaction state, and policies.
- **WildDuck SDK**: Looks up users and augments tokens with account metadata.

Interaction data, authorization codes, refresh tokens, etc., are stored in the `oidc_adapter_store` table (opaque JSON payloads). Admin CRUD endpoints manage records in corresponding tables via Sequelize models.

---

## Key Features

- **OpenID Connect Core**: Authorization Code flow with PKCE, UserInfo endpoint, standard discovery.
- **OAuth 2.0 Grants**: `authorization_code`, `refresh_token`, `client_credentials`, and Token Exchange (`urn:ietf:params:oauth:grant-type:token-exchange`).
- **WildDuck integration**: Authenticates users via WildDuck APIs and enriches ID/access tokens with customer metadata.
- **Admin APIs**: Manage OIDC clients, SAML service providers, and identity policies.
- **PKCE-by-default**: All client flows require S256 code challenges.
- **Token Exchange logging**: Each token exchange is recorded in `token_exchange_events`.
- **Hot reload**: Development script (`npm run dev`) uses `tsx watch` for fast iteration.
- **Container ready**: Dockerfile/Podman compose bundle migrations, model generation, and start-up.

---

## Supported Grants, Scopes & Claims

### Grant Types

| Grant type                                         | Description                                                                                         |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `authorization_code`                               | Interactive login flow (requires PKCE).                                                             |
| `refresh_token`                                    | Used to mint new access/ID tokens. TTL configured for 30 days.                                      |
| `client_credentials`                               | Machine-to-machine tokens (no user context).                                                        |
| `urn:ietf:params:oauth:grant-type:token-exchange`  | Exchanges an existing access token for another audience/resource.                                   |

### Standard Scopes

| Scope             | Claims included                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| `openid`          | Always required; includes `sub`.                                                                                     |
| `profile`         | Name-based claims: `name`, `preferred_username`, `given_name`, `family_name`.                                       |
| `email`           | Email information: `email`, `email_verified`.                                                                        |
| `offline_access`  | Allows issuance of refresh tokens during the authorization grant.                                                    |

### Custom Claims in Access/ID Tokens

| Claim             | Source                           | Description                                                  |
| ----------------- | -------------------------------- | ------------------------------------------------------------ |
| `customer_id`     | `account.internalData.cid`       | Used by Solutrix services to correlate WildDuck customers.   |
| `roles`, `permissions`, `branding` | WildDuck metadata | Included when Tekton policies or downstream services require extended claims. |

The provider fetches the user via WildDuck to populate these claims. If a user is suspended/disabled, login is blocked with a human-readable message.

---

## Environment & Configuration

Most settings live in `.env`. Key variables:

| Variable                        | Description                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                 | PostgreSQL DSN (e.g., `postgresql://user:pass@host:5432/db`).                              |
| `NODE_ENV`                     | `development` (enables HTTP cookies) or `production`.                                      |
| `PORT`/`HOST`                  | Express listener (default `8080` on all interfaces).                                       |
| `OIDC_COOKIE_KEYS`             | Comma-separated HMAC secrets for signing cookies. Required for multi-instance deployments. |
| `OIDC_DEFAULT_*`               | Optional fallback client if DB is empty (ID, secret, redirect URIs).                       |
| `WD_API_URL` / `WD_API_KEY`    | WildDuck SDK endpoint and key.                                                             |
| `ACCESS_TOKEN_EXPIRY_MINUTES`  | Used when seeding metadata for WildDuck login tracking.                                     |

Sequelize migrations are configured via `src/config/config.cjs`. The provider dynamically loads active signing keys from `jwt_rsa256_keys`.

---

## Running Locally

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Run migrations & model generation** (only required the first time or when schemas change):

   ```bash
   npm run migrate
   npm run gen:models
   ```

3. **Start the dev server**

   ```bash
   npm run dev
   ```

   This launches `tsx watch src/server.ts`, seeds the OIDC provider, and listens on `http://localhost:8080`.

4. **Admin API usage** (example: create a client)

   ```bash
   curl -sS -X POST http://localhost:8080/api/global/admin/clients \
     -H 'Content-Type: application/json' \
     -d '{
       "name": "example-app",
       "redirect_uris": ["http://localhost:3000/callback"],
       "grant_types": ["authorization_code","refresh_token"],
       "scopes": ["openid","profile","email","offline_access"]
     }'
   ```

5. **Authorize** (PKCE example)

   ```bash
   CLIENT_ID="..."
   REDIRECT_URI="http://localhost:3000/callback"
   CODE_VERIFIER=$(openssl rand -base64 48 | tr -d '=+/')
   CODE_CHALLENGE=$(printf '%s' "$CODE_VERIFIER" | openssl dgst -binary -sha256 | openssl base64 | tr '+/' '-_' | tr -d '=')
   STATE=$(openssl rand -hex 12)

   AUTHORIZE_URL="http://localhost:8080/oauth/authorize?client_id=$CLIENT_ID&redirect_uri=$(printf %s "$REDIRECT_URI" | jq -s -R -r @uri)&response_type=code&scope=openid%20profile%20email%20offline_access&code_challenge=$CODE_CHALLENGE&code_challenge_method=S256&state=$STATE"
   open "$AUTHORIZE_URL"
   ```

   Complete the login form at `http://localhost:8080/interaction/:uid`.

6. **Exchange code for tokens**

   ```bash
   curl -sS -u "$CLIENT_ID:$CLIENT_SECRET" \
     -H 'Content-Type: application/x-www-form-urlencoded' \
     -d "grant_type=authorization_code&code=$CODE&redirect_uri=$(printf %s "$REDIRECT_URI" | jq -s -R -r @uri)&code_verifier=$CODE_VERIFIER" \
     http://localhost:8080/oauth/token
   ```

   Expect `access_token`, `id_token`, and, if `offline_access` was granted, `refresh_token`.

---

## Admin API Quick Reference

| Method & Endpoint                               | Description                                               |
| ----------------------------------------------- | --------------------------------------------------------- |
| `GET /api/global/admin/clients`                 | List OIDC clients (secrets omitted).                      |
| `POST /api/global/admin/clients`                | Create a client (returns generated `client_secret`).      |
| `PATCH /api/global/admin/clients/:id`           | Update redirect URIs, grants, scopes, rotate secret.      |
| `DELETE /api/global/admin/clients/:id`          | Delete a client and remove it from provider cache.        |
| `GET /api/global/admin/policies`                | List identity policies.                                   |
| `POST /api/global/admin/policies`               | Create a policy (targets service/client).                 |
| `GET /api/global/admin/policies/:id`            | Fetch single policy.                                      |
| `PATCH /api/global/admin/policies/:id`          | Update a policy JSON blob.                                |
| `DELETE /api/global/admin/policies/:id`         | Remove policy.                                            |
| `GET /api/global/admin/saml-service-providers`  | Manage SAML SP metadata (entityID, ACS endpoints, etc.).  |
| `POST /api/global/admin/signing-keys/rotate`    | Rotate RSA signing keys (stores in `jwt_rsa256_keys`).    |

The admin controller translates request payloads into Sequelize records and keeps the in-memory provider cache in sync (see `src/controllers/adminController.ts`).

### Working with Identity Policies

Policies live in the `identity_policies` table and let you define fine-grained access rules that the IDP and downstream token exchange logic can consult. Each policy record contains:

| Field        | Description                                                                                   |
| ------------ | --------------------------------------------------------------------------------------------- |
| `name`       | Human readable identifier (e.g., `customer.read-only`).                                       |
| `targetType` | What the policy applies to (e.g., `client`, `service`, `resource`, `user`).                   |
| `targetId`   | Optional target identifier (client ID, service name, etc.).                                   |
| `policy`     | JSON blob describing the rule (scopes allowed, audiences, claim requirements, etc.).          |

Example create call:

```bash
curl -sS -X POST "$IDP_BASE/api/global/admin/policies" \
  -H 'Content-Type: application/json' \
  -d '{
        "name": "webmail-readonly",
        "target_type": "service",
        "target_id": "webmail",
        "policy": {
          "scopes": ["openid", "profile", "email"],
          "allowed_audiences": ["webmail"],
          "expires_in_minutes": 30
        }
      }'
```

Policies are consumed primarily by the token-exchange flow (`src/oidc/tokenExchange.ts`) and any custom logic you add inside Solutrix-API. The example above could be enforced by:

- Checking that exchanges for service `webmail` only issue the three listed scopes.
- Rejecting tokens for audiences not present in `allowed_audiences`.
- Limiting TTL by inspecting `expires_in_minutes`.

You can fetch active policies with `GET /api/global/admin/policies`, update the JSON via `PATCH`, or delete when no longer required. Inside your services, load the relevant policy and adapt behaviour—for instance, to gate customer directory access:

```ts
const policy = await fetchPolicy('service', 'customer_directory');
if (!policy.policy.scopes.includes('customer.read')) {
  throw new ForbiddenError('Missing customer.read scope');
}
```

Policies provide a convenient place to centralise rules without hardcoding scopes or claims across multiple services. Extend the schema as needed (e.g., add `allowed_roles`, `subject_constraints`, etc.) to fit Solutrix’s multi-tenant requirements.

---

## Authorization Flow Walkthrough

1. **Client registration** – add redirect URIs, scopes, grant types via admin API.
2. **User authorization** – SPA or back-end redirects to `/oauth/authorize` with PKCE parameters.
3. **Interaction session** – user lands on `/interaction/:uid`, enters credentials, WildDuck is queried.
4. **Grant creation** – provider creates/stores grant objects in `oidc_adapter_store`.
5. **Token issuance** – code exchanged for access token, ID token, and optional refresh token.
6. **Token use** – consumer calls `/userinfo` or protected resources with `Authorization: Bearer ...`.
7. **Refresh** – app posts refresh token to `/oauth/token` (`grant_type=refresh_token`) for new access/ID tokens.
8. **Token exchange** (optional) – services exchange tokens for different audience/permissions.

The provider logs token exchange events and emits warnings when interaction payloads are missing (helpful for debugging cookie/signature issues in development).

---

## Integrating from a TypeScript or Svelte App

You can use any OIDC/OAuth client; the example below uses [`oidc-client-ts`](https://github.com/authts/oidc-client-ts), commonly used in Svelte/React/Angular projects.

### Install dependencies

```bash
npm install oidc-client-ts
```

### Client configuration

```ts
// src/lib/oidcClient.ts
import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

const IDP_BASE = 'http://localhost:8080';

export const oidcClient = new UserManager({
  authority: IDP_BASE,
  client_id: 'a4e4ab9f-fc30-4a56-a56b-59518c808e66',
  client_secret: 'b5b5b8439853bed26fb3d98064b4e77f1d2d21b3f75a4c823e5071bfecc2c538',
  redirect_uri: 'http://localhost:3000/callback',
  post_logout_redirect_uri: 'http://localhost:3000/',
  response_type: 'code',
  scope: 'openid profile email offline_access',
  monitorSession: false,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
});
```

### Svelte example (component)

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { oidcClient } from './lib/oidcClient';
  import type { User } from 'oidc-client-ts';

  let user: User | null = null;
  let error: string | null = null;

  onMount(async () => {
    try {
      const existing = await oidcClient.getUser();
      if (existing && !existing.expired) {
        user = existing;
        return;
      }

      await oidcClient.signinRedirect(); // Browser navigates to IDP
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
  });
</script>

{#if error}
  <p class="error">{error}</p>
{:else if user}
  <h2>Welcome {user.profile?.name}</h2>
  <button on:click={() => oidcClient.signoutRedirect()}>Sign out</button>
{:else}
  <p>Redirecting to sign in…</p>
{/if}
```

### Callback handler (Svelte route or standalone page)

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { oidcClient } from './lib/oidcClient';

  onMount(async () => {
    await oidcClient.signinCallback(); // Exchanges code + PKCE verifier
    window.location.replace('/');      // Redirect back into the app
  });
</script>

<p>Completing sign-in…</p>
```

### Refresh tokens & silent renewal

- `oidc-client-ts` automatically handles refresh token exchange if `offline_access` is granted and the token endpoint permits refresh. Use `signinSilent` if you configure an iframe-based silent callback, or rely on refresh tokens with background calls in your store/service layer.
- Check `userManager.events.addAccessTokenExpired(...)` to hook into expiration events and call `signinSilent` or `signinRedirect`.

### Token Exchange (optional advanced use)

If your SPA needs to exchange tokens for other audiences (e.g., APIs with different scopes), call `/oauth/token` with `grant_type=urn:ietf:params:oauth:grant-type:token-exchange`. Ensure the client has the grant enabled when registering via admin API.

---

## Troubleshooting

| Symptom                                             | Likely Cause / Fix                                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `interaction session not found` after login POST    | Browser didn’t send interaction cookie. In dev, verify `OIDC_COOKIE_KEYS`, ensure the host matches, or add `prompt=consent`. |
| `Invalid value "undefined" for header "Location"`   | Interaction payload missing `returnTo`. Check interaction rows in `oidc_adapter_store` and ensure payload isn’t empty (fixed by accessing `entry.get('payload')`). |
| `invalid_client_metadata` when creating client      | `grant_types` or `redirect_uris` include unsupported values. Ensure only standard grants (plus token exchange) are used. |
| No refresh token returned                           | Either `offline_access` scope not requested, or existing grant didn’t include it. Use `prompt=consent`.     |
| Cookies complaining about HTTPS                     | In development `NODE_ENV=development`, so cookies are flagged non-secure. For production, ensure HTTPS.     |

Enable verbose logging by setting `LOG_LEVEL=debug` and watch the console for `[adapter:*]` messages.

---

## Further Reading

- [oidc-provider documentation](https://oidc-provider.readthedocs.io/)
- [OAuth 2.0 Token Exchange RFC 8693](https://datatracker.ietf.org/doc/html/rfc8693)
- [OIDC Core specification](https://openid.net/specs/openid-connect-core-1_0.html)
- [WildDuck API](https://wildduck.email/docs/) – to understand how user metadata is retrieved
- [`oidc-client-ts` guide](https://authts.github.io/oidc-client-ts/) for SPA integrations

---

## License

This repository is private to Solutrix. If you intend to open source, add the appropriate license here.

---

Happy authenticating! If you encounter issues or want to extend functionality (custom prompts, additional grant types, etc.), review the controllers under `src/controllers` and the provider bootstrap in `src/oidc/provider.ts`. All custom behaviour is centralized there.
