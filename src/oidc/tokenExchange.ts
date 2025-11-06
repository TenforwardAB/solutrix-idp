import type { KoaContextWithOIDC, Provider } from "oidc-provider";
import { errors } from "oidc-provider";
import {
    findApplicablePolicy,
    logTokenExchangeEvent,
    type ExchangeEventLog,
} from "../services/tokenExchangePolicyService.js";

const GRANT_TYPE = "urn:ietf:params:oauth:grant-type:token-exchange";
const ISSUED_TOKEN_TYPE = "urn:ietf:params:oauth:token-type:access_token";

const GRANT_PARAMETERS = new Set([
    "subject_token",
    "subject_token_type",
    "actor_token",
    "actor_token_type",
    "resource",
    "audience",
    "scope",
    "requested_token_type",
]);

const SUPPORTED_TOKEN_TYPES = new Set<string>(["urn:ietf:params:oauth:token-type:access_token"]);

const parseScopeParam = (value: unknown): Set<string> => {
    if (typeof value !== "string") {
        return new Set<string>();
    }
    return new Set(
        value
            .split(/\s+/)
            .map((scope) => scope.trim())
            .filter((scope) => scope.length > 0),
    );
};

const setToScopeString = (scopes: Set<string>): string | undefined => {
    if (scopes.size === 0) {
        return undefined;
    }
    return [...scopes].join(" ");
};

const resolveAudience = (ctx: KoaContextWithOIDC): string => {
    const { params } = ctx.oidc;

    const normalize = (input: unknown): string | undefined => {
        if (typeof input === "string" && input.trim().length > 0) {
            return input.trim();
        }
        if (Array.isArray(input)) {
            if (input.length === 0) {
                return undefined;
            }
            if (input.length > 1) {
                throw new errors.InvalidTarget("multiple audience/resource values are not supported");
            }
            const [value] = input;
            if (typeof value === "string" && value.trim().length > 0) {
                return value.trim();
            }
        }
        return undefined;
    };

    const requestedAudience = normalize(params.audience) ?? normalize(params.resource);
    if (!requestedAudience) {
        throw new errors.InvalidRequest("audience parameter is required for token exchange");
    }
    return requestedAudience;
};

const ensureSupportedSubjectTokenType = (value: unknown): string => {
    if (typeof value !== "string" || value.length === 0) {
        throw new errors.InvalidRequest("subject_token_type must be a non-empty string");
    }
    if (!SUPPORTED_TOKEN_TYPES.has(value)) {
        throw new errors.InvalidRequest("unsupported subject_token_type");
    }
    return value;
};

const ensureSupportedActorTokenType = (value: unknown): string => {
    if (typeof value !== "string" || value.length === 0) {
        throw new errors.InvalidRequest("actor_token_type must be a non-empty string");
    }
    if (!SUPPORTED_TOKEN_TYPES.has(value)) {
        throw new errors.InvalidRequest("unsupported actor_token_type");
    }
    return value;
};

const getTokenString = (value: unknown, name: string): string => {
    if (typeof value !== "string" || value.length === 0) {
        throw new errors.InvalidRequest(`${name} must be a non-empty string`);
    }
    return value;
};

const validateRequestedTokenType = (value: unknown): void => {
    if (value === undefined) {
        return;
    }
    if (typeof value !== "string" || value.length === 0) {
        throw new errors.InvalidRequest("requested_token_type must be a non-empty string when present");
    }
    if (value !== ISSUED_TOKEN_TYPE) {
        throw new errors.InvalidRequest("requested_token_type is not supported");
    }
};

export const registerTokenExchangeGrant = (provider: Provider): void => {
    const handler = async (ctx: KoaContextWithOIDC): Promise<void> => {
        const { client } = ctx.oidc;

        if (!client) {
            throw new errors.InvalidClient("client authentication is required");
        }

        const logEntry: ExchangeEventLog = {
            clientId: client.clientId,
            subjectTokenType: typeof ctx.oidc.params.subject_token_type === "string" ? ctx.oidc.params.subject_token_type : "unknown",
            requestedScopes: [...parseScopeParam(ctx.oidc.params.scope)],
            success: false,
        };

        try {
            validateRequestedTokenType(ctx.oidc.params.requested_token_type);

            const subjectTokenType = ensureSupportedSubjectTokenType(ctx.oidc.params.subject_token_type);
            logEntry.subjectTokenType = subjectTokenType;

            const subjectTokenValue = getTokenString(ctx.oidc.params.subject_token, "subject_token");
            const subjectToken = await ctx.oidc.provider.AccessToken.find(subjectTokenValue);

            if (!subjectToken || !subjectToken.isValid) {
                throw new errors.InvalidGrant("invalid subject_token");
            }

            if (subjectToken.clientId !== client.clientId) {
                throw new errors.InvalidGrant("subject_token was not issued to the authenticated client");
            }

            if (subjectToken.kind !== "AccessToken") {
                throw new errors.InvalidGrant("unsupported subject_token");
            }

            logEntry.subject = subjectToken.accountId ?? null;
            logEntry.subjectTokenId = subjectToken.jti ?? null;

            const requestedAudience = resolveAudience(ctx);
            logEntry.requestedAudience = requestedAudience;

            const actorTokenPresented = ctx.oidc.params.actor_token !== undefined;
            if (actorTokenPresented && ctx.oidc.params.actor_token_type === undefined) {
                throw new errors.InvalidRequest("actor_token_type must be provided with actor_token");
            }

            let actorSubject: string | null = null;
            if (actorTokenPresented) {
                const actorTokenType = ensureSupportedActorTokenType(ctx.oidc.params.actor_token_type);
                if (actorTokenType !== subjectTokenType) {
                    throw new errors.InvalidRequest("actor_token_type must match subject_token_type");
                }
                const actorTokenValue = getTokenString(ctx.oidc.params.actor_token, "actor_token");
                const actorToken = await ctx.oidc.provider.AccessToken.find(actorTokenValue);

                if (!actorToken || !actorToken.isValid) {
                    throw new errors.InvalidGrant("invalid actor_token");
                }

                if (actorToken.clientId !== client.clientId) {
                    throw new errors.InvalidGrant("actor_token was not issued to the authenticated client");
                }

                actorSubject = actorToken.accountId ?? null;
                logEntry.actorSubject = actorSubject;
            }

            const policyMatch = await findApplicablePolicy({
                clientId: client.clientId,
                subject: subjectToken.accountId ?? undefined,
                subjectTokenType,
                requestedAudience,
                actorPresent: actorTokenPresented,
            });

            if (!policyMatch) {
                throw new errors.InvalidGrant("token exchange is not permitted for this subject or audience");
            }

            logEntry.policyId = policyMatch.policy.id;

            const requestedScopes = parseScopeParam(ctx.oidc.params.scope);
            const subjectScopes = parseScopeParam(subjectToken.scope);

            if (requestedScopes.size === 0 && subjectScopes.size > 0) {
                subjectScopes.forEach((scope) => requestedScopes.add(scope));
            }

            const missingScopes = [...requestedScopes].filter((scope) => !subjectScopes.has(scope));
            if (missingScopes.length > 0) {
                throw new errors.InvalidScope("requested scope exceeds the rights of the subject_token", missingScopes.join(" "));
            }

            logEntry.requestedScopes = [...requestedScopes];

            const policyScopes = new Set(
                (policyMatch.policy.scopes ?? [])
                    .map((scope) => scope.trim())
                    .filter((scope) => scope.length > 0),
            );

            if (policyScopes.size > 0 && !policyScopes.has("*")) {
                const forbidden = [...requestedScopes].filter((scope) => !policyScopes.has(scope));
                if (forbidden.length > 0) {
                    throw new errors.InvalidScope("requested scope is not permitted by policy", forbidden.join(" "));
                }
            }

            const grantedScopes =
                policyScopes.size > 0 && !policyScopes.has("*")
                    ? new Set([...requestedScopes].filter((scope) => policyScopes.has(scope)))
                    : requestedScopes;

            const token = new ctx.oidc.provider.AccessToken({
                accountId: subjectToken.accountId,
                client,
                grantId: subjectToken.grantId,
                gty: GRANT_TYPE,
                sessionUid: subjectToken.sessionUid,
                sid: subjectToken.sid,
                scope: setToScopeString(grantedScopes),
            });

            if (subjectToken.claims) {
                token.claims = subjectToken.claims;
            }

            const extra = {
                ...(subjectToken.extra || {}),
                token_exchange: {
                    subject_token_jti: subjectToken.jti ?? null,
                    subject_token_type: subjectTokenType,
                },
            } as Record<string, unknown>;

            if (actorSubject) {
                extra.act = { sub: actorSubject };
                if (subjectToken.accountId && subjectToken.accountId !== actorSubject) {
                    extra.may_act = { sub: subjectToken.accountId };
                }
            }

            token.extra = extra;

            token.setAudience(requestedAudience);

            ctx.oidc.entity("AccessToken", token);

            const value = await token.save();

            logEntry.success = true;
            logEntry.grantedAudience = requestedAudience;
            logEntry.grantedScopes = [...grantedScopes];
            logEntry.issuedTokenId = token.jti ?? null;

            ctx.body = {
                access_token: value,
                issued_token_type: ISSUED_TOKEN_TYPE,
                token_type: token.tokenType,
                expires_in: token.expiration,
                scope: setToScopeString(grantedScopes),
            };
        } catch (error) {
            logEntry.error = error instanceof Error ? error.message : String(error);
            throw error;
        } finally {
            await logTokenExchangeEvent(logEntry);
        }
    };

    provider.registerGrantType(GRANT_TYPE, handler, GRANT_PARAMETERS);
};
