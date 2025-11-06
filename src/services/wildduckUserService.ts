import { wds } from "../config/db.js";

export interface WildDuckAccount {
    id: string;
    email: string;
    username?: string;
    name?: string;
    activated: boolean;
    suspended: boolean;
    disabled: boolean;
    metaData: Record<string, any>;
    internalData: Record<string, any>;
}

/**
 * Safely coerce a value into an object.
 */
const toObject = (value: any): Record<string, any> => {
    if (!value) {
        return {};
    }
    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        } catch {
            return {};
        }
    }
    if (typeof value === "object") {
        return value as Record<string, any>;
    }
    return {};
};

/**
 * Authenticate a user against the WildDuck API.
 *
 * @param username - Login identifier.
 * @param password - Plaintext password.
 * @returns WildDuck account id.
 */
export const authenticateWildDuckUser = async (username: string, password: string): Promise<string> => {
    const response = await wds.authentication.authenticate(username, password);

    if (!response?.success || !response?.id) {
        throw new Error("Invalid credentials");
    }

    return response.id as string;
};

/**
 * Fetch full user details from WildDuck.
 *
 * @param userId - WildDuck account id.
 * @returns Enriched account metadata.
 */
export const fetchWildDuckAccount = async (userId: string): Promise<WildDuckAccount> => {
    const user = await wds.users.getUser(userId);

    if (!user?.success) {
        throw new Error("User not found in WildDuck");
    }

    return {
        id: user.id,
        email: user.address,
        username: user.username,
        name: user.name,
        activated: Boolean(user.activated),
        suspended: Boolean(user.suspended),
        disabled: Boolean(user.disabled),
        metaData: toObject(user.metaData),
        internalData: toObject(user.internalData),
    };
};

/**
 * Build OIDC claims from a WildDuck account.
 */
export const buildOidcClaims = (account: WildDuckAccount): Record<string, any> => {
    const { internalData, metaData } = account;

    const profile = toObject(internalData.profile || metaData.profile);
    const attributeBag = toObject(metaData.attributes || internalData.attributes);
    const idpMeta = toObject(metaData.idp);

    const roles = attributeBag.roles || internalData.roles || (internalData.role ? [internalData.role] : undefined);
    const permissions = attributeBag.permissions || internalData.permissions;

    const claims: Record<string, any> = {
        sub: account.id,
        email: account.email,
        email_verified: account.activated && !account.suspended && !account.disabled,
        preferred_username: account.username || account.email,
    };

    if (profile.given_name) {
        claims.given_name = profile.given_name;
    }

    if (profile.family_name) {
        claims.family_name = profile.family_name;
    }

    if (profile.name || account.name) {
        claims.name = profile.name || account.name;
    }

    if (internalData.cid) {
        claims.customer_id = internalData.cid;
    }

    if (roles) {
        claims.roles = Array.isArray(roles) ? roles : [roles];
    }

    if (permissions) {
        claims.permissions = permissions;
    }

    if (idpMeta.branding) {
        claims.branding = idpMeta.branding;
    }

    if (idpMeta.attributes) {
        Object.assign(claims, idpMeta.attributes);
    }

    return claims;
};

/**
 * Merge IDP login metadata for persistence in WildDuck.
 */
export const mergeIdpLoginMetadata = (
    account: WildDuckAccount,
    updates: {
        clientId?: string;
        scope?: string;
        loginIp?: string;
        userAgent?: string;
        timestamp: string;
    },
): { metaData: Record<string, any>; internalData: Record<string, any> } => {
    const metaData = { ...account.metaData };
    const internalData = { ...account.internalData };

    const idpMeta: Record<string, any> = {
        ...toObject(metaData.idp),
        lastLoginAt: updates.timestamp,
        lastClientId: updates.clientId,
        lastLoginIp: updates.loginIp,
        lastUserAgent: updates.userAgent,
    };

    if (updates.scope) {
        idpMeta.lastGrantedScope = updates.scope;
    }

    metaData.idp = idpMeta;
    internalData.lastLoginAt = updates.timestamp;
    if (updates.clientId) {
        internalData.lastClientId = updates.clientId;
    }

    return { metaData, internalData };
};
