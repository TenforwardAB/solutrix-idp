import { type Response } from "express";
import crypto from "node:crypto";
import models, { sequelize } from "../config/db.js";
import { removeProviderClient, syncProviderClient } from "./adminController.js";
import { type OidcAdminRequest } from "../middleware/requireOidcAdmin.js";
import { decryptSecret, encryptSecret } from "../services/secretStore.js";
import { logAdminAuditEvent } from "../services/adminAuditService.js";

const TENANT_GRANT_TYPES = new Set(["authorization_code", "refresh_token"]);
const TENANT_SCOPES = new Set(["openid", "profile", "email", "account", "offline_access"]);

const toStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof value === "string") {
        return value.split(/[\s,]+/).map((item) => item.trim()).filter(Boolean);
    }
    return [];
};

const normalizeGrantTypes = (value: unknown): string[] => {
    const requested = toStringArray(value);
    const filtered = requested.filter((grant) => TENANT_GRANT_TYPES.has(grant));
    const withCode = filtered.includes("authorization_code") ? filtered : ["authorization_code", ...filtered];
    return Array.from(new Set(withCode));
};

const normalizeScopes = (value: unknown): string[] => {
    const requested = toStringArray(value);
    const base = requested.length > 0 ? requested : ["openid", "profile", "email"];
    const filtered = base.filter((scope) => TENANT_SCOPES.has(scope));
    return Array.from(new Set(filtered.includes("openid") ? filtered : ["openid", ...filtered]));
};

const isLocalhost = (hostname: string): boolean =>
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || hostname === "::1";

const validateRedirectUris = (uris: string[]): boolean =>
    uris.length > 0 && uris.every((uri) => {
        try {
            const parsed = new URL(uri);
            if (parsed.hash) {
                return false;
            }
            if (parsed.protocol === "https:") {
                return true;
            }
            return parsed.protocol === "http:" && isLocalhost(parsed.hostname);
        } catch {
            return false;
        }
    });

const sanitizeClient = (client: any): Record<string, unknown> => {
    const data = client.get({ plain: true }) as any;
    delete data.clientSecret;
    return {
        id: data.id,
        client_id: data.clientId,
        name: data.name,
        redirect_uris: data.redirectUris,
        grant_types: data.grantTypes,
        scopes: data.scopes,
        post_logout_redirect_uris: data.postLogoutRedirectUris,
        customer_id: data.customerId,
        created_by_subject: data.createdBySubject,
        created_by_email: data.createdByEmail,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
    };
};

const ownedClientWhere = (req: OidcAdminRequest): Record<string, string> => ({
    id: req.params.id,
    customerId: req.oidcAdmin?.customerId ?? "",
});

export const listTenantClients = async (req: OidcAdminRequest, res: Response): Promise<void> => {
    const clients = await models.oidc_clients.findAll({
        where: { customerId: req.oidcAdmin?.customerId },
        order: [["createdAt", "DESC"]],
    });
    res.json(clients.map(sanitizeClient));
};

export const getTenantClient = async (req: OidcAdminRequest, res: Response): Promise<void> => {
    const client = await models.oidc_clients.findOne({ where: ownedClientWhere(req) });
    if (!client) {
        res.status(404).json({ error: "client_not_found" });
        return;
    }
    res.json(sanitizeClient(client));
};

export const createTenantClient = async (req: OidcAdminRequest, res: Response): Promise<void> => {
    const admin = req.oidcAdmin!;
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const redirectUris = toStringArray(req.body.redirect_uris ?? req.body.redirectUris);
    const postLogoutRedirectUris = toStringArray(
        req.body.post_logout_redirect_uris ?? req.body.postLogoutRedirectUris,
    );
    const grantTypes = normalizeGrantTypes(req.body.grant_types ?? req.body.grantTypes);
    const scopes = normalizeScopes(req.body.scopes);

    if (!name || !validateRedirectUris(redirectUris) || !validateRedirectUris(postLogoutRedirectUris.length ? postLogoutRedirectUris : redirectUris)) {
        res.status(400).json({ error: "invalid_client_payload" });
        return;
    }

    const clientId = crypto.randomUUID();
    const clientSecret = crypto.randomBytes(32).toString("hex");
    const transaction = await sequelize.transaction();

    try {
        const record = await models.oidc_clients.create(
            {
                name,
                clientId,
                clientSecret: encryptSecret(clientSecret),
                redirectUris,
                grantTypes,
                scopes,
                postLogoutRedirectUris: postLogoutRedirectUris.length > 0 ? postLogoutRedirectUris : null,
                customerId: admin.customerId,
                createdBySubject: admin.subject,
                createdByEmail: admin.email ?? null,
            },
            { transaction },
        );

        await syncProviderClient({
            clientId,
            clientSecret,
            redirectUris,
            grantTypes,
            scopes,
            name,
            postLogoutRedirectUris,
        });

        await transaction.commit();
        await logAdminAuditEvent(req, {
            subject: admin.subject,
            email: admin.email,
            customerId: admin.customerId,
            authType: "oidc",
        }, {
            action: "client.create",
            targetType: "oidc_client",
            targetId: String(record.get("id")),
            metadata: { clientId, name },
        });

        res.status(201).json({
            ...sanitizeClient(record),
            client_secret: clientSecret,
        });
    } catch (error) {
        await transaction.rollback();
        console.error("Failed to create tenant client", error);
        res.status(500).json({ error: "client_create_failed" });
    }
};

export const updateTenantClient = async (req: OidcAdminRequest, res: Response): Promise<void> => {
    const admin = req.oidcAdmin!;
    const transaction = await sequelize.transaction();

    try {
        const client = await models.oidc_clients.findOne({ where: ownedClientWhere(req), transaction });
        if (!client) {
            await transaction.rollback();
            res.status(404).json({ error: "client_not_found" });
            return;
        }

        const updates: Record<string, unknown> = {};
        if (typeof req.body.name === "string" && req.body.name.trim()) {
            updates.name = req.body.name.trim();
        }
        if (req.body.redirect_uris || req.body.redirectUris) {
            const redirectUris = toStringArray(req.body.redirect_uris ?? req.body.redirectUris);
            if (!validateRedirectUris(redirectUris)) {
                await transaction.rollback();
                res.status(400).json({ error: "invalid_redirect_uris" });
                return;
            }
            updates.redirectUris = redirectUris;
        }
        if (req.body.post_logout_redirect_uris || req.body.postLogoutRedirectUris) {
            const postLogoutRedirectUris = toStringArray(
                req.body.post_logout_redirect_uris ?? req.body.postLogoutRedirectUris,
            );
            if (postLogoutRedirectUris.length > 0 && !validateRedirectUris(postLogoutRedirectUris)) {
                await transaction.rollback();
                res.status(400).json({ error: "invalid_post_logout_redirect_uris" });
                return;
            }
            updates.postLogoutRedirectUris = postLogoutRedirectUris.length > 0 ? postLogoutRedirectUris : null;
        }
        if (req.body.grant_types || req.body.grantTypes) {
            updates.grantTypes = normalizeGrantTypes(req.body.grant_types ?? req.body.grantTypes);
        }
        if (req.body.scopes) {
            updates.scopes = normalizeScopes(req.body.scopes);
        }

        await client.update(updates, { transaction });
        const payload = client.get({ plain: true }) as any;

        await syncProviderClient({
            clientId: payload.clientId,
            clientSecret: decryptSecret(payload.clientSecret),
            redirectUris: payload.redirectUris,
            grantTypes: payload.grantTypes,
            scopes: payload.scopes,
            name: payload.name,
            postLogoutRedirectUris: payload.postLogoutRedirectUris ?? [],
        });

        await transaction.commit();
        await logAdminAuditEvent(req, {
            subject: admin.subject,
            email: admin.email,
            customerId: admin.customerId,
            authType: "oidc",
        }, {
            action: "client.update",
            targetType: "oidc_client",
            targetId: req.params.id,
            metadata: { clientId: payload.clientId, updatedFields: Object.keys(updates) },
        });

        res.json(sanitizeClient(client));
    } catch (error) {
        await transaction.rollback();
        console.error("Failed to update tenant client", error);
        res.status(500).json({ error: "client_update_failed" });
    }
};

export const rotateTenantClientSecret = async (req: OidcAdminRequest, res: Response): Promise<void> => {
    const admin = req.oidcAdmin!;
    const client = await models.oidc_clients.findOne({ where: ownedClientWhere(req) });
    if (!client) {
        res.status(404).json({ error: "client_not_found" });
        return;
    }

    const clientSecret = crypto.randomBytes(32).toString("hex");
    await client.update({ clientSecret: encryptSecret(clientSecret) });
    const payload = client.get({ plain: true }) as any;
    await syncProviderClient({
        clientId: payload.clientId,
        clientSecret,
        redirectUris: payload.redirectUris,
        grantTypes: payload.grantTypes,
        scopes: payload.scopes,
        name: payload.name,
        postLogoutRedirectUris: payload.postLogoutRedirectUris ?? [],
    });

    await logAdminAuditEvent(req, {
        subject: admin.subject,
        email: admin.email,
        customerId: admin.customerId,
        authType: "oidc",
    }, {
        action: "client.rotate_secret",
        targetType: "oidc_client",
        targetId: req.params.id,
        metadata: { clientId: payload.clientId },
    });

    res.json({
        ...sanitizeClient(client),
        client_secret: clientSecret,
    });
};

export const deleteTenantClient = async (req: OidcAdminRequest, res: Response): Promise<void> => {
    const admin = req.oidcAdmin!;
    const client = await models.oidc_clients.findOne({ where: ownedClientWhere(req) });
    if (!client) {
        res.status(404).json({ error: "client_not_found" });
        return;
    }

    const clientId = client.get("clientId") as string;
    await client.destroy();
    await removeProviderClient(clientId);
    await logAdminAuditEvent(req, {
        subject: admin.subject,
        email: admin.email,
        customerId: admin.customerId,
        authType: "oidc",
    }, {
        action: "client.delete",
        targetType: "oidc_client",
        targetId: req.params.id,
        metadata: { clientId },
    });

    res.status(204).send();
};
