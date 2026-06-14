# OIDC Admin Auth Workflow

Status: WIP

This document describes the current split between normal organization admin access and break-glass superadmin access in `solutrix-idp`, plus how `solutrix-ui` and `solutrix-api` participate in the flow.

## Goals

- Normal admin actions should use the user's OIDC login and access token.
- Organization admins should only manage OIDC clients owned by their own organization/customer.
- Break-glass admin access should remain available for recovery and bootstrap, but should be clearly separated from normal admin workflows.
- Secrets should not be exposed to browser code.
- The first version should stay small and keep existing Solutrix components working.

## Route Split

### Organization admin

Base route:

```text
/api/admin
```

Current client management routes:

```text
GET    /api/admin/clients
POST   /api/admin/clients
GET    /api/admin/clients/:id
PUT    /api/admin/clients/:id
POST   /api/admin/clients/:id/rotate-secret
DELETE /api/admin/clients/:id
```

These routes require:

- `Authorization: Bearer <access_token>`
- a valid local `oidc-provider` access token
- `customer_id` in user claims
- either an allowed admin role or an explicit `idp_clients` permission claim

Implementation:

- `src/server.ts`
- `src/routes/tenantAdminRoutes.ts`
- `src/middleware/requireOidcAdmin.ts`
- `src/controllers/tenantAdminController.ts`

### Break-glass admin

Base route:

```text
/api/global/admin
```

This remains protected by the static admin API key and is intended for bootstrap, incident recovery, and superadmin-only maintenance.

The GUI break-glass route is also still available when enabled:

```text
/gui
/gui/api
```

Implementation:

- `src/server.ts`
- `src/routes/adminRoutes.ts`
- `src/middleware/requireAdminApiKey.ts`
- `src/middleware/masterPasswordAuth.ts`
- `src/middleware/auditBreakGlassAdmin.ts`

## Access Model

The IdP reads user attributes from WildDuck metadata/internal data and builds OIDC claims in:

```text
src/services/wildduckUserService.ts
```

The organization admin API expects:

```json
{
  "sub": "wildduck-user-id",
  "email": "admin@example.test",
  "customer_id": "customer-or-org-id",
  "roles": ["Organization_Admin"],
  "permissions": {
    "idp_clients": ["read:own", "create:own", "update:own", "delete:own"]
  }
}
```

Role-based access is currently allowed for these roles by default:

```text
Admiral
Station_Admin
IdP_Admin
Organization_Admin
```

This can be overridden with:

```text
IDP_ADMIN_ROLES=Admiral,Station_Admin,IdP_Admin,Organization_Admin
```

Permission-based access supports:

```json
{
  "permissions": {
    "idp_clients": ["read:own", "create:own", "update:own", "delete:own"]
  }
}
```

The middleware also accepts object-shaped permission resources, for example:

```json
{
  "permissions": {
    "idp_clients": {
      "read:own": ["*"],
      "create:own": ["*"]
    }
  }
}
```

## Tenant Client Ownership

OIDC clients now have ownership metadata:

```text
oidc_clients.customerId
oidc_clients.createdBySubject
oidc_clients.createdByEmail
```

Normal organization admin routes always filter by `customerId`.

This means:

- organization admins can only list their own clients
- organization admins can only read/update/delete their own clients
- created clients are stamped with the actor subject/email and customer id
- global break-glass admin can still see and manage all clients through `/api/global/admin`

## Client Creation Rules

Organization-created clients are intentionally restricted:

Allowed grant types:

```text
authorization_code
refresh_token
```

Allowed scopes:

```text
openid
profile
email
account
offline_access
```

Redirect URI rules:

- `https://...` is allowed
- `http://localhost/...`, `http://127.0.0.1/...`, and `http://[::1]/...` are allowed for local development
- URI fragments are rejected

Client secrets are generated server-side, encrypted at rest, and returned only on creation/rotation.

## UI Flow

`solutrix-ui` already performs Authorization Code + PKCE and stores the IdP session in HttpOnly cookies.

The browser cannot read the access token directly, which is intentional. For IdP admin calls, UI should call the new BFF route:

```text
/idp-api/admin/clients
```

The SvelteKit server route:

```text
../solutrix-ui/src/routes/idp-api/[...path]/+server.ts
```

does the following:

- reads `idp_session` / `idp_refresh` HttpOnly cookies
- refreshes the access token when needed
- forwards the request to `IDP_BASE` / `PUBLIC_IDP_BASE`
- adds `Authorization: Bearer <access_token>`
- strips browser cookies and hop-by-hop headers from the upstream request

Example:

```ts
await fetch('/idp-api/admin/clients');
```

maps to:

```text
GET <IDP_BASE>/api/admin/clients
Authorization: Bearer <access_token>
```

## API Compatibility

`solutrix-api` now accepts roles from OIDC claims in `checkUserHasRole()` before falling back to the old database role lookup.

Implementation:

```text
../solutrix-api/src/middleware/checkUserRoleMiddleware.ts
```

This matters for bootstrap or partially empty API databases, where the IdP token may already contain useful ABAC/role context while the API role tables are not fully populated.

Current behavior:

- token role `Admiral` passes any `checkUserHasRole(...)`
- token role matching the required role also passes
- if no matching token role exists, the old DB lookup is used

## Break-Glass Hardening

The static admin API key route is still intentionally present, but hardened:

- API key comparison uses constant-time comparison
- failed API key attempts are logged without printing the key
- optional IP allowlist is available
- successful break-glass route usage is audit logged

Configuration:

```text
ADMIN_API_KEY=...
ADMIN_API_KEY_HEADER=x-admin-api-key
ADMIN_API_ALLOWED_IPS=127.0.0.1,10.0.0.10
```

If `ADMIN_API_ALLOWED_IPS` is not set, no IP allowlist is enforced.

The GUI master password middleware also uses constant-time comparison.

## Audit Events

Admin actions are written to:

```text
admin_audit_events
```

Important columns:

```text
actorSubject
actorEmail
customerId
action
targetType
targetId
authType
ip
userAgent
metadata
createdAt
```

Organization admin actions use:

```text
authType = oidc
```

Break-glass actions use:

```text
authType = break_glass
```

Audit writes are best-effort: failed audit writes are logged but do not currently fail the admin operation.

## Database Migrations

Relevant migrations:

```text
src/migrations/20250215001200-add-admin-ownership-to-oidc-clients.cjs
src/migrations/20250215001300-create-admin-audit-events.cjs
```

Existing client records will have `customerId = null`. They are therefore global/break-glass managed until assigned to a customer or recreated through the organization admin flow.

## Verification

Expected unauthenticated response:

```bash
curl -s http://localhost:8080/api/admin/clients
```

```json
{"error":"missing_bearer_token"}
```

Verify migrated schema:

```bash
podman exec idpdb psql -U api_user -d idp -c \
  "select column_name from information_schema.columns where table_name='oidc_clients' and column_name in ('customerId','createdBySubject','createdByEmail') order by column_name;"
```

```bash
podman exec idpdb psql -U api_user -d idp -c \
  "select to_regclass('public.admin_audit_events') as admin_audit_events;"
```

Build checks:

```bash
npm run build
```

For sibling projects:

```bash
cd ../solutrix-api && npm run build
cd ../solutrix-ui && npm run build
```

## Current Limitations

- Organization admin UI screens are not implemented yet; only the BFF route exists.
- Client domain ownership is not yet verified against a customer domain registry.
- `customer_id` currently comes from WildDuck-backed claims. If that metadata is missing, organization admin access is denied.
- Audit logging is best-effort rather than transactionally mandatory.
- Existing global clients are not automatically assigned to a customer.
- The permission model is intentionally small and should later align more tightly with the ABAC model in `solutrix-api`.

## Future Work

- Add UI screens for organization-owned OIDC clients.
- Add customer domain validation for redirect URI hosts.
- Add admin audit viewer/export with filtering by customer and actor.
- Decide whether audit write failure should block high-risk operations such as secret rotation.
- Consider mTLS/VPN enforcement for break-glass endpoints at proxy level.
- Move role/permission mapping toward a shared ABAC contract between IdP and API.
