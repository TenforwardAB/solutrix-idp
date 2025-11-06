import { Provider, type Configuration, type KoaContextWithOIDC, type Interaction } from "oidc-provider";
import jose from "node-jose";
import dotenv from "dotenv";
import models from "../config/db.js";
import SequelizeAdapter from "./adapter.js";
import { buildOidcClaims, fetchWildDuckAccount } from "../services/wildduckUserService.js";
import { registerTokenExchangeGrant } from "./tokenExchange.js";

const TOKEN_EXCHANGE_GRANT = "urn:ietf:params:oauth:grant-type:token-exchange";

dotenv.config();

let providerInstance: Provider | null = null;

/**
 * Load active RSA signing keys from the database.
 *
 * @returns Populated JWK keystore.
 */
const loadSigningKeys = async (): Promise<jose.JWK.KeyStore> => {
    const keystore = jose.JWK.createKeyStore();
    const keyRows = await models.jwt_rsa256_keys.findAll({
        where: { isInvalid: false },
        order: [["createdAt", "DESC"]],
    });

    if (!keyRows || keyRows.length === 0) {
        throw new Error("No active signing keys found in jwt_rsa256_keys");
    }

    for (const keyRow of keyRows) {
        const record = keyRow.get({ plain: true }) as { privateKey: string; keyId: string };
        const privateKey = record.privateKey;
        const kid = record.keyId;

        await keystore.add(privateKey, "pem", {
            kid,
            use: "sig",
            alg: "RS256",
        });
    }

    return keystore;
};

/**
 * Read statically configured clients from environment variables.
 *
 * @returns Array of client metadata or empty array.
 */
const readStaticClients = (): Configuration["clients"] => {
    if (process.env.OIDC_CLIENTS_JSON) {
        try {
            const parsed = JSON.parse(process.env.OIDC_CLIENTS_JSON);
            if (Array.isArray(parsed)) {
                return parsed as Configuration["clients"];
            }
        } catch (error) {
            console.warn("Failed to parse OIDC_CLIENTS_JSON", error);
        }
    }

    const clientId = process.env.OIDC_DEFAULT_CLIENT_ID;
    const clientSecret = process.env.OIDC_DEFAULT_CLIENT_SECRET;
    const redirectUris = process.env.OIDC_DEFAULT_REDIRECT_URIS;

    if (!clientId || !clientSecret || !redirectUris) {
        return [];
    }

    return [
        {
            client_id: clientId,
            client_secret: clientSecret,
            grant_types: ["authorization_code", "refresh_token", "client_credentials", TOKEN_EXCHANGE_GRANT],
            response_types: ["code"],
            redirect_uris: redirectUris.split(",").map((uri) => uri.trim()),
            token_endpoint_auth_method: "client_secret_basic",
        },
    ];
};

type DbClientRecord = {
    clientId: string;
    clientSecret: string;
    redirectUris: string[];
    grantTypes: string[];
    scopes: string[];
};

/**
 * Load client definitions from the database.
 *
 * @returns Client metadata formatted for oidc-provider.
 */
const fetchDbClients = async (): Promise<Configuration["clients"]> => {
    const rows = await models.oidc_clients.findAll({ order: [["createdAt", "ASC"]] });

    const normalized = rows.map((row: any) => {
        const data = row.get({ plain: true }) as DbClientRecord;
        const redirectUris = Array.isArray(data.redirectUris) ? data.redirectUris : [];
        const grantTypes = Array.isArray(data.grantTypes) ? data.grantTypes : [];
        const scopes = Array.isArray(data.scopes) ? data.scopes : [];

        return {
            client_id: data.clientId,
            client_secret: data.clientSecret,
            redirect_uris: redirectUris,
            grant_types: grantTypes,
            response_types: grantTypes.includes("implicit") ? ["code", "id_token"] : ["code"],
            token_endpoint_auth_method: "client_secret_basic",
            scope: scopes.length > 0 ? scopes.join(" ") : undefined,
        } satisfies Configuration["clients"][number];
    });

    console.log(`[oidc] Fetched ${normalized.length} client(s) from database.`);
    if (normalized.length > 0) {
        for (const client of normalized) {
            console.log(
                "[oidc]   client_id=%s redirect_uris=%j grant_types=%j scope=%s",
                client.client_id,
                client.redirect_uris,
                client.grant_types,
                client.scope,
            );
        }
    }

    return normalized;
};

/**
 * Derive the issuer URL from environment variables.
 *
 * @returns Issuer string.
 */
const issuerFromEnv = (): string => {
    const explicitIssuer = process.env.OIDC_ISSUER;
    if (explicitIssuer) {
        return explicitIssuer;
    }
    const port = process.env.PORT || "8080";
    return `http://localhost:${port}`;
};

/**
 * Resolve an account during OIDC interactions.
 *
 * @param ctx - Koa context with OIDC details.
 * @param sub - Subject identifier.
 * @returns Account object or undefined.
 */
const findAccount: Configuration["findAccount"] = async (ctx: KoaContextWithOIDC, sub: string | undefined) => {
    try {
        if (!sub) {
            return undefined;
        }
        const account = await fetchWildDuckAccount(sub);

        return {
            accountId: account.id,
            async claims() {
                return buildOidcClaims(account);
            },
        };
    } catch (error) {
        ctx?.oidc?.provider?.ctx?.logger?.error?.("Failed to find account", { error, sub });
        return undefined;
    }
};

/**
 * Lazily initialize and return the singleton oidc-provider instance.
 *
 * @returns Provider instance.
 */
export const getProvider = async (): Promise<Provider> => {
    if (providerInstance) {
        return providerInstance;
    }

    await SequelizeAdapter.connect();
    const keystore = await loadSigningKeys();

    const dbClients = await fetchDbClients();
    if (dbClients.length === 0) {
        console.warn("[oidc] No clients found in database; relying on static configuration.");
    }

    const secureCookies = (process.env.NODE_ENV ?? "development").toLowerCase() === "production";

    const configuration: Configuration = {
        adapter: SequelizeAdapter,
        clients: dbClients.length > 0 ? dbClients : readStaticClients(),
        findAccount,
        interactions: {
            url(_ctx: KoaContextWithOIDC, interaction: Interaction) {
                return `/interaction/${interaction.uid}`;
            },
        },
        cookies: {
            keys: (process.env.OIDC_COOKIE_KEYS || "default-cookie-secret-change-me").split(","),
            long: { signed: true, secure: secureCookies ? "auto" : false },
            short: { signed: true, secure: secureCookies ? "auto" : false },
            names: {
                session: "idp.sid",
                interaction: "idp.interaction",
                resume: "idp.resume",
            },
        },
        pkce: {
            required: () => true,
            methods: ["S256"],
        },
        scopes: ["openid", "profile", "email", "offline_access"],
        claims: {
            openid: ["sub"],
            email: ["email", "email_verified"],
            profile: ["name", "preferred_username", "given_name", "family_name"],
            account: ["customer_id", "roles", "permissions", "branding"],
        },
        routes: {
            authorization: "/oauth/authorize",
            token: "/oauth/token",
            jwks: "/oauth/jwks.json",
            userinfo: "/userinfo",
            introspection: "/oauth/introspect",
            revocation: "/oauth/revoke",
            end_session: "/oauth/logout",
        },
        features: {
            devInteractions: { enabled: false },
            revocation: { enabled: true },
            introspection: { enabled: true },
            userinfo: { enabled: true },
            clientCredentials: { enabled: true },
            backchannelLogout: { enabled: false },
            registration: { enabled: false },
            pushedAuthorizationRequests: { enabled: false },
            deviceFlow: { enabled: false },
        },
        ttl: {
            AccessToken: 600,
            AuthorizationCode: 300,
            IdToken: 600,
            RefreshToken: 60 * 60 * 24 * 30,
        },
        extraTokenClaims: async (ctx: KoaContextWithOIDC) => {
            if (!ctx?.oidc?.account?.accountId) {
                return {};
            }
            try {
                const account = await fetchWildDuckAccount(ctx.oidc.account.accountId);
                return {
                    customer_id: account.internalData?.cid,
                };
            } catch (error) {
                ctx?.oidc?.provider?.ctx?.logger?.error?.("extraTokenClaims failure", { error });
                return {};
            }
        },
        jwks: keystore.toJSON(true),
    };

    const issuer = issuerFromEnv();

    providerInstance = new Provider(issuer, configuration);
    providerInstance.proxy = true;
    registerTokenExchangeGrant(providerInstance);
    providerInstance.on("authorization.error", (ctx: any, err: any) => {
        console.error("authorization.error", err.message, {
            clientId: ctx?.oidc?.client?.clientId,
            error: err.error,
            detail: (err as any).error_description,
        });
    });
    providerInstance.on("grant.error", (ctx: any, err: any) => {
        console.error("grant.error", err.message, {
            clientId: ctx?.oidc?.client?.clientId,
            error: err.error,
            detail: (err as any).error_description,
        });
    });
    providerInstance.on("server_error", (_ctx: any, err: any) => {
        console.error("server_error", err);
    });

    return providerInstance;
};

export default getProvider;
