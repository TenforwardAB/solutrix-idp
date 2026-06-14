import { type NextFunction, type Request, type Response } from "express";
import getProvider from "../oidc/provider.js";
import { buildOidcClaims, fetchWildDuckAccount } from "../services/wildduckUserService.js";

type Scope = "own" | "any";

export type OidcAdmin = {
    subject: string;
    email?: string;
    customerId?: string;
    roles: string[];
    permissions: Record<string, any>;
    claims: Record<string, any>;
    token: string;
    clientId?: string;
};

export interface OidcAdminRequest extends Request {
    oidcAdmin?: OidcAdmin;
}

const configuredAdminRoles = (): Set<string> =>
    new Set(
        (process.env.IDP_ADMIN_ROLES ?? "Admiral,Station_Admin,IdP_Admin,Organization_Admin")
            .split(",")
            .map((role) => role.trim())
            .filter(Boolean),
    );

const toArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.map((item) => String(item)).filter(Boolean);
    }
    if (typeof value === "string") {
        return value.split(/[\s,]+/).map((item) => item.trim()).filter(Boolean);
    }
    return [];
};

const toObject = (value: unknown): Record<string, any> => {
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
    return typeof value === "object" ? value as Record<string, any> : {};
};

const hasRoleBasedAdmin = (admin: OidcAdmin): boolean => {
    const allowed = configuredAdminRoles();
    return admin.roles.some((role) => allowed.has(role));
};

export const hasIdpClientPermission = (admin: OidcAdmin, action: string, scope: Scope = "own"): boolean => {
    if (hasRoleBasedAdmin(admin)) {
        return true;
    }

    const permissions = toObject(admin.permissions);
    const resource = permissions.idp_clients ?? permissions.oidc_clients ?? permissions.idp_admin;
    const acceptedKeys = [`${action}:${scope}`, `${action}:any`, `*:${scope}`, "*:any"];

    if (Array.isArray(resource)) {
        return resource.some((entry) => acceptedKeys.includes(String(entry)));
    }

    if (resource && typeof resource === "object") {
        return acceptedKeys.some((key) => Object.prototype.hasOwnProperty.call(resource, key));
    }

    return false;
};

const bearerToken = (req: Request): string | undefined => {
    const header = req.header("authorization");
    if (!header?.toLowerCase().startsWith("bearer ")) {
        return undefined;
    }
    return header.slice("bearer ".length).trim();
};

export const requireOidcAdmin = async (
    req: OidcAdminRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    const token = bearerToken(req);
    if (!token) {
        res.status(401).json({ error: "missing_bearer_token" });
        return;
    }

    try {
        const provider = await getProvider();
        const accessToken = await (provider as any).AccessToken.find(token);
        if (!accessToken?.isValid || !accessToken.accountId) {
            res.status(401).json({ error: "invalid_bearer_token" });
            return;
        }

        const account = await fetchWildDuckAccount(accessToken.accountId);
        const claims = buildOidcClaims(account);
        const roles = toArray(claims.roles);
        const permissions = toObject(claims.permissions);
        const customerId = claims.customer_id ? String(claims.customer_id) : undefined;

        req.oidcAdmin = {
            subject: String(claims.sub || accessToken.accountId),
            email: claims.email,
            customerId,
            roles,
            permissions,
            claims,
            token,
            clientId: accessToken.clientId,
        };

        next();
    } catch (error) {
        console.error("OIDC admin authentication failed", error);
        res.status(401).json({ error: "invalid_bearer_token" });
    }
};

export const requireIdpClientPermission = (action: string) => (
    req: OidcAdminRequest,
    res: Response,
    next: NextFunction,
): void => {
    const admin = req.oidcAdmin;
    if (!admin) {
        res.status(401).json({ error: "missing_admin_context" });
        return;
    }
    if (!admin.customerId) {
        res.status(403).json({ error: "missing_customer_context" });
        return;
    }
    if (!hasIdpClientPermission(admin, action, "own")) {
        res.status(403).json({ error: "insufficient_idp_admin_permission" });
        return;
    }
    next();
};
