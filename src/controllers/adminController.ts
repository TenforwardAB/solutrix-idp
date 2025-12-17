import { Request, Response } from "express";
import crypto from "node:crypto";
import jose from "node-jose";
import models, { sequelize } from "../config/db.js";
import getProvider from "../oidc/provider.js";
import weakCache from "oidc-provider/lib/helpers/weak_cache.js";

/**
 * Normalize an incoming value into an array of trimmed strings.
 *
 * @param value - Raw value that may be a string, array, or other type.
 * @returns Array of non-empty trimmed strings.
 */
const toStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter((item) => item.length > 0);
    }
    if (typeof value === "string") {
        return value
            .split(/[\s,]+/)
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
    }
    return [];
};

/**
 * Convert the provided value into JSON, returning a fallback if conversion fails.
 *
 * @param value - Potential JSON input.
 * @param fallback - Default object or array when parsing fails.
 * @returns Parsed value or fallback.
 */
const ensureJson = (value: unknown, fallback: Record<string, unknown> | unknown[] = {}): any => {
    if (value === undefined || value === null) {
        return fallback;
    }
    if (typeof value === "object") {
        return value;
    }
    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        } catch {
            return fallback;
        }
    }
    return fallback;
};

/**
 * Map synchronization errors into HTTP status codes and payloads.
 *
 * @param error - Error thrown during provider synchronization.
 * @returns Status and payload for the HTTP response.
 */
const mapClientSyncError = (
    error: unknown,
): { status: number; payload: Record<string, unknown> } => {
    if (error && typeof error === "object") {
        const err = error as { error?: unknown; error_description?: unknown };
        if (err.error === "invalid_client_metadata") {
            return {
                status: 400,
                payload: {
                    error: "invalid_client_metadata",
                    detail:
                        typeof err.error_description === "string"
                            ? err.error_description
                            : "client metadata rejected by provider",
                },
            };
        }
    }

    return {
        status: 500,
        payload: { error: "client_sync_failed" },
    };
};


/**
 * List all registered OIDC/OAuth clients.
 *
 * @param _req - Express request (unused).
 * @param res - Express response used to send the list.
 */
export const listClients = async (_req: Request, res: Response): Promise<void> => {
    const clients = await models.oidc_clients.findAll({ order: [["createdAt", "DESC"]] });
    const payload = clients.map((client: any) => {
        const data = client.get({ plain: true }) as any;
        delete data.clientSecret;
        return data;
    });
    res.json(payload);
};

/**
 * Retrieve a specific client by its database identifier.
 *
 * @param req - Express request containing path param `id`.
 * @param res - Express response used to return the client payload.
 */
export const getClient = async (req: Request, res: Response): Promise<void> => {
    const client = await models.oidc_clients.findByPk(req.params.id);
    if (!client) {
        res.status(404).json({ error: "client_not_found" });
        return;
    }
    const data = client.get({ plain: true }) as any;
    delete data.clientSecret;
    res.json(data);
};

/**
 * Create a new client and register it with the OIDC provider.
 *
 * @param req - Request body with client attributes.
 * @param res - Response used to emit the created client.
 */
export const createClient = async (req: Request, res: Response): Promise<void> => {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const redirectUris = toStringArray(req.body.redirect_uris ?? req.body.redirectUris);
    const grantTypes = toStringArray(req.body.grant_types ?? req.body.grantTypes);
    const scopes = toStringArray(req.body.scopes);
    const postLogoutRedirectUris = toStringArray(
        req.body.post_logout_redirect_uris ?? req.body.postLogoutRedirectUris,
    );

    if (!name || redirectUris.length === 0 || grantTypes.length === 0) {
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
                clientSecret,
                redirectUris,
                grantTypes,
                scopes,
                postLogoutRedirectUris: postLogoutRedirectUris.length > 0 ? postLogoutRedirectUris : null,
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

        res.status(201).json({
            id: record.get("id"),
            client_id: clientId,
            client_secret: clientSecret,
            name,
            redirect_uris: redirectUris,
            grant_types: grantTypes,
            scopes,
            post_logout_redirect_uris: postLogoutRedirectUris.length > 0 ? postLogoutRedirectUris : undefined,
        });
    } catch (error) {
        await transaction.rollback();
        console.error("Failed to create client", error);
        const { status, payload } = mapClientSyncError(error);
        res.status(status).json(payload);
    }
};

/**
 * Update an existing client and synchronize changes to the provider.
 *
 * @param req - Request containing path param `id` and payload updates.
 * @param res - Response used to return the updated record.
 */
export const updateClient = async (req: Request, res: Response): Promise<void> => {
    const transaction = await sequelize.transaction();
    try {
        const client = await models.oidc_clients.findByPk(req.params.id, { transaction });
        if (!client) {
            await transaction.rollback();
            res.status(404).json({ error: "client_not_found" });
            return;
        }

        const updates: Record<string, unknown> = {};

        if (req.body.name) {
            updates.name = String(req.body.name).trim();
        }
        if (req.body.redirect_uris || req.body.redirectUris) {
            const redirectUris = toStringArray(req.body.redirect_uris ?? req.body.redirectUris);
            if (redirectUris.length === 0) {
                await transaction.rollback();
                res.status(400).json({ error: "redirect_uris_required" });
                return;
            }
            updates.redirectUris = redirectUris;
        }
        if (req.body.grant_types || req.body.grantTypes) {
            const grantTypes = toStringArray(req.body.grant_types ?? req.body.grantTypes);
            if (grantTypes.length === 0) {
                await transaction.rollback();
                res.status(400).json({ error: "grant_types_required" });
                return;
            }
            updates.grantTypes = grantTypes;
        }
        if (req.body.scopes) {
            updates.scopes = toStringArray(req.body.scopes);
        }
        if (req.body.post_logout_redirect_uris || req.body.postLogoutRedirectUris) {
            updates.postLogoutRedirectUris = toStringArray(
                req.body.post_logout_redirect_uris ?? req.body.postLogoutRedirectUris,
            );
        }
        if (req.body.rotate_secret === true) {
            updates.clientSecret = crypto.randomBytes(32).toString("hex");
        }

        await client.update(updates, { transaction });
        const payload = client.get({ plain: true }) as any;

        await syncProviderClient({
            clientId: payload.clientId,
            clientSecret: updates.clientSecret ? String(updates.clientSecret) : payload.clientSecret,
            redirectUris: payload.redirectUris,
            grantTypes: payload.grantTypes,
            scopes: payload.scopes,
            name: payload.name,
            postLogoutRedirectUris: payload.postLogoutRedirectUris ?? [],
        });

        await transaction.commit();

        const response: Record<string, unknown> = {
            id: payload.id,
            client_id: payload.clientId,
            name: payload.name,
            redirect_uris: payload.redirectUris,
            grant_types: payload.grantTypes,
            scopes: payload.scopes,
            post_logout_redirect_uris: payload.postLogoutRedirectUris,
        };

        if (updates.clientSecret) {
            response.client_secret = updates.clientSecret;
        }

        res.json(response);
    } catch (error) {
        await transaction.rollback();
        console.error("Failed to update client", error);
        const { status, payload } = mapClientSyncError(error);
        res.status(status).json(payload);
    }
};

/**
 * Delete a client and remove it from the provider cache.
 *
 * @param req - Request with path param `id`.
 * @param res - Response, returns 204 on success.
 */
export const deleteClient = async (req: Request, res: Response): Promise<void> => {
    const record = await models.oidc_clients.findByPk(req.params.id);
    if (!record) {
        res.status(404).json({ error: "client_not_found" });
        return;
    }

    const clientId = record.get("clientId") as string;

    const deleted = await models.oidc_clients.destroy({ where: { id: req.params.id } });
    if (deleted === 0) {
        res.status(404).json({ error: "client_not_found" });
        return;
    }

    await removeProviderClient(clientId);

    res.status(204).send();
};

/**
 * List all SAML service providers.
 *
 * @param _req - Express request (unused).
 * @param res - Express response used to send the list.
 */
export const listServiceProviders = async (_req: Request, res: Response): Promise<void> => {
    const providers = await models.saml_service_providers.findAll({ order: [["createdAt", "DESC"]] });
    res.json(providers.map((provider: any) => provider.get({ plain: true })));
};

/**
 * Retrieve a SAML service provider by id.
 *
 * @param req - Request containing path param `id`.
 * @param res - Response used to return the service provider.
 */
export const getServiceProvider = async (req: Request, res: Response): Promise<void> => {
    const provider = await models.saml_service_providers.findByPk(req.params.id);
    if (!provider) {
        res.status(404).json({ error: "service_provider_not_found" });
        return;
    }
    res.json(provider.get({ plain: true }));
};

/**
 * Create a SAML service provider definition.
 *
 * @param req - Request body with service provider configuration.
 * @param res - Response that returns the created record.
 */
export const createServiceProvider = async (req: Request, res: Response): Promise<void> => {
    const entityId = typeof req.body.entity_id === "string" ? req.body.entity_id.trim() : "";
    const metadataXml = typeof req.body.metadata_xml === "string" ? req.body.metadata_xml : undefined;
    const acsEndpoints = toStringArray(req.body.acs ?? req.body.acs_endpoints ?? req.body.acsEndpoints);
    const binding = typeof req.body.binding === "string" ? req.body.binding.trim() : "";
    const attributeMapping = ensureJson(req.body.attr_mapping ?? req.body.attribute_mapping ?? req.body.attributeMapping, {});

    if (!entityId || acsEndpoints.length === 0 || !binding) {
        res.status(400).json({ error: "invalid_service_provider_payload" });
        return;
    }

    const record = await models.saml_service_providers.create({
        entityId,
        metadataXml,
        acsEndpoints,
        binding,
        attributeMapping,
    });

    res.status(201).json(record.get({ plain: true }));
};

/**
 * Update an existing SAML service provider.
 *
 * @param req - Request with path param `id` and payload updates.
 * @param res - Response containing the updated record.
 */
export const updateServiceProvider = async (req: Request, res: Response): Promise<void> => {
    const provider: any = await models.saml_service_providers.findByPk(req.params.id);
    if (!provider) {
        res.status(404).json({ error: "service_provider_not_found" });
        return;
    }

    const updates: Record<string, unknown> = {};

    if (req.body.entity_id || req.body.entityId) {
        updates.entityId = String(req.body.entity_id ?? req.body.entityId).trim();
    }
    if (req.body.metadata_xml) {
        updates.metadataXml = String(req.body.metadata_xml);
    }
    if (req.body.acs || req.body.acs_endpoints || req.body.acsEndpoints) {
        const acsEndpoints = toStringArray(req.body.acs ?? req.body.acs_endpoints ?? req.body.acsEndpoints);
        if (acsEndpoints.length === 0) {
            res.status(400).json({ error: "acs_endpoints_required" });
            return;
        }
        updates.acsEndpoints = acsEndpoints;
    }
    if (req.body.binding) {
        updates.binding = String(req.body.binding).trim();
    }
    if (req.body.attr_mapping || req.body.attribute_mapping || req.body.attributeMapping) {
        updates.attributeMapping = ensureJson(
            req.body.attr_mapping ?? req.body.attribute_mapping ?? req.body.attributeMapping,
            {},
        );
    }

    await provider.update(updates);
    res.json(provider.get({ plain: true }));
};

/**
 * Delete a SAML service provider.
 *
 * @param req - Request with path param `id`.
 * @param res - Response returning 204 on success.
 */
export const deleteServiceProvider = async (req: Request, res: Response): Promise<void> => {
    const deleted = await models.saml_service_providers.destroy({ where: { id: req.params.id } });
    if (deleted === 0) {
        res.status(404).json({ error: "service_provider_not_found" });
        return;
    }
    res.status(204).send();
};

/**
 * Generate and persist a new RSA signing key pair.
 *
 * @param _req - Request object (unused).
 * @param res - Response sending the new key metadata.
 */
export const rotateSigningKey = async (_req: Request, res: Response): Promise<void> => {
    const keystore = jose.JWK.createKeyStore();
    const key = await keystore.generate("RSA", 2048, { use: "sig", alg: "RS256" });
    const publicKey = key.toPEM();
    const privateKey = key.toPEM(true);
    const keyId = crypto.randomBytes(4).toString("hex");

    const record = await models.jwt_rsa256_keys.create({
        publicKey,
        privateKey,
        keyId,
        isInvalid: false,
    });

    await record.reload();

    res.status(201).json({
        key_id: record.get("keyId"),
        public_key: publicKey,
        created_at: record.get("createdAt"),
    });
};

/**
 * List all identity policies.
 *
 * @param _req - Request object (unused).
 * @param res - Response containing policy list.
 */
export const listPolicies = async (_req: Request, res: Response): Promise<void> => {
    const policies = await models.identity_policies.findAll({ order: [["createdAt", "DESC"]] });
    res.json(policies.map((policy: any) => policy.get({ plain: true })));
};

/**
 * Retrieve an identity policy.
 *
 * @param req - Request with path param `id`.
 * @param res - Response containing the policy.
 */
export const getPolicy = async (req: Request, res: Response): Promise<void> => {
    const policy = await models.identity_policies.findByPk(req.params.id);
    if (!policy) {
        res.status(404).json({ error: "policy_not_found" });
        return;
    }
    res.json(policy.get({ plain: true }));
};

/**
 * Create a new identity policy.
 *
 * @param req - Request payload describing the policy.
 * @param res - Response with the created policy.
 */
export const createPolicy = async (req: Request, res: Response): Promise<void> => {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const targetType = typeof req.body.target_type === "string" ? req.body.target_type.trim() : "";
    const targetId = typeof req.body.target_id === "string" ? req.body.target_id.trim() : undefined;
    const policy = ensureJson(req.body.policy, {});

    if (!name || !targetType) {
        res.status(400).json({ error: "invalid_policy_payload" });
        return;
    }

    const record = await models.identity_policies.create({
        name,
        targetType,
        targetId: targetId || null,
        policy,
    });

    res.status(201).json(record.get({ plain: true }));
};

/**
 * Update an existing identity policy.
 *
 * @param req - Request with path param `id` and updates.
 * @param res - Response containing the updated policy.
 */
export const updatePolicy = async (req: Request, res: Response): Promise<void> => {
    const policy: any = await models.identity_policies.findByPk(req.params.id);
    if (!policy) {
        res.status(404).json({ error: "policy_not_found" });
        return;
    }

    const updates: Record<string, unknown> = {};
    if (req.body.name) {
        updates.name = String(req.body.name).trim();
    }
    if (req.body.target_type) {
        updates.targetType = String(req.body.target_type).trim();
    }
    if (req.body.target_id !== undefined) {
        const value = req.body.target_id === null ? null : String(req.body.target_id).trim();
        updates.targetId = value;
    }
    if (req.body.policy !== undefined) {
        updates.policy = ensureJson(req.body.policy, {});
    }

    await policy.update(updates);
    res.json(policy.get({ plain: true }));
};

/**
 * Delete an identity policy.
 *
 * @param req - Request with path param `id`.
 * @param res - Response returning 204 on success.
 */
export const deletePolicy = async (req: Request, res: Response): Promise<void> => {
    const deleted = await models.identity_policies.destroy({ where: { id: req.params.id } });
    if (deleted === 0) {
        res.status(404).json({ error: "policy_not_found" });
        return;
    }
    res.status(204).send();
};
/**
 * Deduplicate and normalize grant type strings.
 *
 * @param grantTypes - Raw grant type values.
 * @returns Unique, trimmed grant types.
 */
const normalizeGrantTypes = (grantTypes: string[]): string[] =>
    Array.from(
        new Set(
            grantTypes
                .map((grant) => String(grant).trim())
                .filter((grant) => grant.length > 0),
        ),
    );

/**
 * Register client metadata with the oidc-provider instance.
 *
 * @param provider - Active provider instance.
 * @param metadata - Client metadata payload.
 * @param clientId - Identifier used to refresh caches.
 */
const registerProviderClient = async (
    provider: Awaited<ReturnType<typeof getProvider>>,
    metadata: Record<string, unknown>,
    clientId: string,
): Promise<void> => {
    const providerClient = new provider.Client(metadata);
    await provider.Client.adapter.upsert(providerClient.clientId, providerClient.metadata());

    const internals = weakCache(provider);
    if (internals) {
        internals.staticClients ||= new Map();
        internals.staticClients.set(providerClient.clientId, providerClient.metadata());
        internals.dynamicClients?.clear?.();
    }

    const hydrated = await provider.Client.find(clientId);
    console.log("[admin] Provider cache refreshed for %s: %s", clientId, hydrated ? "success" : "missing");
};

/**
 * Persist the client definition inside oidc-provider.
 *
 * @param client - Client details to synchronize.
 */
const syncProviderClient = async (client: {
    clientId: string;
    clientSecret: string;
    redirectUris: string[];
    grantTypes: string[];
    scopes: string[];
    name?: string;
    postLogoutRedirectUris?: string[];
}): Promise<void> => {
    const provider = await getProvider();
    const grantTypes = normalizeGrantTypes(client.grantTypes);

    const metadata: Record<string, unknown> = {
        client_id: client.clientId,
        client_secret: client.clientSecret,
        redirect_uris: client.redirectUris,
        grant_types: grantTypes,
        response_types: grantTypes.includes("implicit") ? ["code", "id_token"] : ["code"],
        token_endpoint_auth_method: "client_secret_basic",
        scope: client.scopes.length > 0 ? client.scopes.join(" ") : undefined,
    };

    if (client.name) {
        metadata.client_name = client.name;
    }
    if (client.postLogoutRedirectUris && client.postLogoutRedirectUris.length > 0) {
        metadata.post_logout_redirect_uris = client.postLogoutRedirectUris;
    }

    const existing = await provider.Client.find(client.clientId);
    console.log("[admin] %s provider client %s", existing ? "Updating" : "Adding", client.clientId);

    try {
        await registerProviderClient(provider, metadata, client.clientId);
    } catch (error) {
        console.error("Failed to synchronize client with provider", error);
        throw error;
    }
};

/**
 * Remove a client from the provider and clear cache entries.
 *
 * @param clientId - Client identifier to delete.
 */
const removeProviderClient = async (clientId: string): Promise<void> => {
    try {
        const provider = await getProvider();
        await provider.Client.adapter.destroy(clientId);

        const internals = weakCache(provider);
        internals?.staticClients?.delete(clientId);
        internals?.dynamicClients?.clear?.();
    } catch (error) {
        console.error("Failed to remove client from provider", error);
    }
};
