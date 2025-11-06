## 1. Verifying End-User access_token in the Service APIs

By default our IDP issues opaque access tokens (they’re short random strings, not JWTs), so the consumer must ask the issuer to validate them. Each Service API should therefore call the introspection endpoint on the IDP:

1. Register a confidential client that the service will use purely for introspection (e.g., service-introspector). Allowed grant types can just be client_credentials.
2. Call /oauth/introspect whenever a request arrives with Authorization: Bearer <token>:

   import fetch from 'node-fetch';

   const INTROSPECTION_URL = 'http://idp.internal/oauth/introspect';
   const CLIENT_ID = 'service-introspector';
   const CLIENT_SECRET = '...';

   export async function validateAccessToken(token: string) {
   const response = await fetch(INTROSPECTION_URL, {
   method: 'POST',
   headers: {
   'Content-Type': 'application/x-www-form-urlencoded',
   Authorization:
   'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
   },
   body: new URLSearchParams({ token }),
   });

   if (!response.ok) throw new Error(`Introspection failed: ${response.statusText}`);
   const payload = await response.json();

   if (!payload.active) {
   throw new Error('Token inactive/invalid');
   }

   // payload.sub, payload.scope, payload.exp, payload.client_id, etc.
   return payload;
   }
3. Cache the result for (at most) the remaining TTL (payload.exp - now) to avoid hammering the IDP.
4. If you ever switch to JWT access tokens, you can skip introspection and verify the signature using the IDP JWKS (GET /oauth/jwks.json). For now the system is configured for opaque tokens, so introspection is required.

———

## 2. Machine-to-Machine Token from Solutrix-API → Service APIs

Use the client credentials grant so Solutrix-API can authenticate to the IDP and obtain its own access token that the Service APIs can validate the same way (via introspection).

### 2.1 Create the service client

Register a dedicated client for Solutrix-API:

curl -sS -X POST "$IDP_BASE/api/global/admin/clients" \
-H 'Content-Type: application/json' \
-d '{
"name": "solutrix-api",
"redirect_uris": [],
"grant_types": ["client_credentials"],
"scopes": ["service.api"]
}'

- No redirect URIs needed.
- Use a custom scope (service.api) to indicate what the token allows.

Record the client_id and client_secret.

### 2.2 Fetch & cache the token inside Solutrix-API

// solutrix-api/src/security/serviceToken.ts
import fetch from 'node-fetch';

const TOKEN_URL = process.env.IDP_TOKEN_URL ?? 'http://idp.internal/oauth/token';
const CLIENT_ID = process.env.IDP_CLIENT_ID!;
const CLIENT_SECRET = process.env.IDP_CLIENT_SECRET!;
const SCOPE = 'service.api';

type CachedToken = { accessToken: string; expiresAt: number };
let cache: CachedToken | null = null;

export async function getServiceToken(): Promise<string> {
const now = Date.now();
if (cache && cache.expiresAt - now > 30_000) {
return cache.accessToken;
}

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: SCOPE,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to obtain service token: ${response.statusText}`);
    }

    const body = await response.json();
    cache = {
      accessToken: body.access_token,
      expiresAt: now + (body.expires_in ?? 600) * 1000,
    };
    return cache.accessToken;
}

Usage when Solutrix-API calls a downstream service:

const token = await getServiceToken();
await fetch('https://service.internal/some-endpoint', {
headers: { Authorization: `Bearer ${token}` },
});

### 2.3 Verify the machine token in the Service API

Exactly the same as step 1—call /oauth/introspect with your service’s own credentials. The introspection response will include client_id: "solutrix-api" and any scopes (e.g., service.api), so the Service API can enforce permissions.

———

### Recap

- End-user tokens: opaque; Service APIs must introspect.
- Solutrix-API → Service APIs: use client_credentials, cache in memory, and always introspect on the receiving side to verify scope and expiry.
- Future option: if you need JWT access tokens instead, configure oidc-provider’s formats to issue JWTs and validate them locally; until then, introspection is the authoritative check.