import { Request, Response } from "express";
import crypto from "node:crypto";
import getProvider from "../oidc/provider.js";
import {
    authenticateWildDuckUser,
    fetchWildDuckAccount,
    mergeIdpLoginMetadata,
} from "../services/wildduckUserService.js";
import { wds } from "../config/db.js";
import { renderConsentPage } from "../views/interaction/consentPage.js";
import { renderLoginPage } from "../views/interaction/loginPage.js";
import type { Provider } from "oidc-provider";

type InteractionDetails = Awaited<ReturnType<Provider["interactionDetails"]>>;

const cookieKeyStrings = (process.env.OIDC_COOKIE_KEYS || "default-cookie-secret-change-me")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
const interactionCookiePrimaryKey =
    cookieKeyStrings.length > 0 ? cookieKeyStrings[0] : "default-cookie-secret-change-me";

/**
 * Sign an interaction cookie using the configured HMAC secret.
 *
 * @param cookieName - Name of the interaction cookie.
 * @param value - Interaction identifier.
 * @returns Base64URL encoded signature.
 */
const signInteractionCookie = (cookieName: string, value: string): string => {
    const base = `${cookieName}=${value}`;
    return crypto
        .createHmac("sha1", interactionCookiePrimaryKey)
        .update(base)
        .digest("base64")
        .replace(/\//g, "_")
        .replace(/\+/g, "-")
        .replace(/=/g, "");
};

/**
 * Render the login view to the response object.
 *
 * @param provider - Active OIDC provider.
 * @param res - Express response object.
 * @param interaction - Interaction details from oidc-provider.
 * @param options - Optional template overrides.
 * @param forcedUid - UID inferred from the route when cookies are missing.
 */
/**
 * Render the login view to the response object.
 *
 * @param provider - Active OIDC provider.
 * @param res - Express response object.
 * @param interaction - Interaction details from oidc-provider.
 * @param options - Optional template overrides.
 * @param forcedUid - UID inferred from the route when cookies are missing.
 */
const renderLoginView = async (
    provider: Provider,
    res: Response,
    interaction: InteractionDetails,
    options?: { error?: string; username?: string; status?: number },
    forcedUid?: string,
) => {
    const clientId = interaction.params?.client_id as string | undefined;
    const client = clientId ? await provider.Client.find(clientId) : undefined;
    const effectiveUid = forcedUid && forcedUid !== "undefined" ? forcedUid : interaction.uid;

    const username =
        options?.username ??
        (interaction.lastSubmission && typeof interaction.lastSubmission.login === "object"
            ? interaction.lastSubmission.login.login_hint
            : undefined) ??
        (typeof interaction.params?.login_hint === "string" ? interaction.params.login_hint : undefined);

    const html = renderLoginPage({
        uid: effectiveUid ?? interaction.uid,
        clientName: client?.metadata?.client_name || clientId || "OIDC Client",
        scope: typeof interaction.params?.scope === "string" ? interaction.params.scope : undefined,
        username,
        error: options?.error,
    });

    res.status(options?.status ?? 200).type("html").send(html);
};

/**
 * Render a minimal consent page listing requested scopes.
 */
const renderConsentView = (
    res: Response,
    params: { clientName?: string; scope?: string; uid: string; clientId?: string },
    status = 200,
): void => {
    const html = renderConsentPage({
        uid: params.uid,
        clientName: params.clientName,
        clientId: params.clientId,
        scope: params.scope,
    });

    res.status(status).type("html").send(html);
};

/**
 * Ensure the interaction has an authorization grant with appropriate scopes.
 *
 * @param provider - Active OIDC provider.
 * @param interaction - Interaction details.
 * @param accountId - Optional account identifier.
 * @returns Persisted grant identifier.
 */
/**
 * Ensure the interaction has an authorization grant with appropriate scopes.
 *
 * @param provider - Active OIDC provider.
 * @param interaction - Interaction details.
 * @param accountId - Optional account identifier.
 * @returns Persisted grant identifier.
 */
const ensureGrant = async (
    provider: Provider,
    interaction: InteractionDetails,
    accountId?: string,
): Promise<string | undefined> => {
    const { grantId: existingGrantId, params, prompt } = interaction;
    const details = prompt?.details || {};
    let grant = existingGrantId ? await provider.Grant.find(existingGrantId) : undefined;

    if (!grant) {
        if (!accountId) {
            return existingGrantId;
        }
        grant = new provider.Grant({
            accountId,
            clientId: params?.client_id as string,
        });
    }

    if (typeof params?.scope === "string" && params.scope.length > 0) {
        grant.addOIDCScope(params.scope);
    }

    if (Array.isArray(details.missingOIDCScope) && details.missingOIDCScope.length > 0) {
        grant.addOIDCScope(details.missingOIDCScope.join(" "));
    }

    if (details.missingOIDCClaims) {
        grant.addOIDCClaims(details.missingOIDCClaims);
    }

    if (details.missingResourceScopes) {
        for (const [resource, scopes] of Object.entries(details.missingResourceScopes)) {
            if (Array.isArray(scopes) && scopes.length > 0) {
                grant.addResourceScope(resource, scopes.join(" "));
            }
        }
    }

    return grant.save();
};

/**
 * Handle GET requests for the interaction route.
 *
 * @param req - Express request object.
 * @param res - Express response used to render the login view.
 */
export const showInteraction = async (req: Request, res: Response): Promise<void> => {
    try {
        const provider = await getProvider();
        const interaction = await provider.interactionDetails(req, res);
        const routeUid = typeof req.params.uid === "string" ? req.params.uid : undefined;

        if (interaction.prompt?.name === "consent") {
            const clientId = interaction.params?.client_id as string | undefined;
            const client = clientId ? await provider.Client.find(clientId) : undefined;
            const scope = typeof interaction.params?.scope === "string" ? interaction.params.scope : undefined;
            renderConsentView(
                res,
                {
                    clientName: client?.metadata?.client_name,
                    clientId,
                    scope,
                    uid: routeUid ?? interaction.uid,
                },
                200,
            );
            return;
        }

        if (interaction.prompt?.name && interaction.prompt.name !== "login") {
            const accountId = interaction.session?.accountId;
            const grantId = await ensureGrant(provider, interaction, accountId);

            await provider.interactionFinished(
                req,
                res,
                {
                    consent: grantId ? { grantId } : {},
                },
                { mergeWithLastSubmission: true },
            );
            return;
        }

        await renderLoginView(provider, res, interaction, undefined, routeUid);
    } catch (error) {
        console.error("Failed to render interaction", error);
        res.status(500).json({ error: "interaction_error" });
    }
};

/**
 * Authenticate the user via WildDuck and finish the interaction.
 *
 * @param req - Express request containing login submission.
 * @param res - Express response returning redirects or errors.
 */
export const login_wd = async (req: Request, res: Response): Promise<void> => {
    try {
        const rawUid =
            (typeof req.body.uid === "string" && req.body.uid.length > 0 ? req.body.uid : undefined) ??
            (typeof req.params.uid === "string" && req.params.uid.length > 0 ? req.params.uid : undefined);
        const explicitUid = rawUid && rawUid !== "undefined" ? rawUid : undefined;

        const provider = await getProvider();

        if (explicitUid) {
            // when the cookie is missing, manually seed it before reading interaction details
            const cookieName = provider.cookieName("interaction");
            const existingHeader = typeof req.headers.cookie === "string" ? req.headers.cookie : "";
            const hasCookie = existingHeader
                .split(/;\s*/)
                .some((part) => part.startsWith(`${cookieName}=`) || part.startsWith(`${cookieName}.sig=`));

            if (!hasCookie) {
                const baseValue = `${cookieName}=${explicitUid}`;
                const signature = signInteractionCookie(cookieName, explicitUid);
                const filtered = existingHeader
                    ? existingHeader
                          .split(/;\s*/)
                          .filter(
                              (part) =>
                                  part.length > 0 &&
                                  !part.startsWith(`${cookieName}=`) &&
                                  !part.startsWith(`${cookieName}.sig=`),
                          )
                    : [];
                filtered.push(baseValue);
                filtered.push(`${cookieName}.sig=${signature}`);
                req.headers.cookie = filtered.join("; ");
                (req as any).cookies = {
                    ...(req as any).cookies,
                    [cookieName]: explicitUid,
                };
            }
        }

        const interaction = await provider.interactionDetails(req, res);

        if (interaction.prompt?.name && interaction.prompt.name !== "login") {
            res.redirect(`/interaction/${encodeURIComponent(interaction.uid)}`);
            return;
        }

        if (explicitUid && interaction.uid !== explicitUid) {
            console.warn("login_wd interaction uid mismatch", {
                expected: explicitUid,
                actual: interaction.uid,
            });
        }

        const username = typeof req.body.username === "string" ? req.body.username.trim() : "";
        const password = typeof req.body.password === "string" ? req.body.password : "";

        if (!username || !password) {
            await renderLoginView(provider, res, interaction, {
                error: "Username and password are required.",
                username,
                status: 400,
            }, explicitUid);
            return;
        }

        let userId: string;

        try {
            userId = await authenticateWildDuckUser(username, password);
        } catch {
            await renderLoginView(provider, res, interaction, {
                error: "Invalid username or password.",
                username,
                status: 401,
            }, explicitUid);
            return;
        }

        const account = await fetchWildDuckAccount(userId);
        console.log("login_wd account", account);

        if (!account.activated || account.suspended || account.disabled) {
            await renderLoginView(provider, res, interaction, {
                error: "Account is not active. Contact the administrator.",
                username,
                status: 403,
            }, explicitUid);
            return;
        }

        const nowIso = new Date().toISOString();
        const clientId = interaction.params?.client_id as string | undefined;
        const loginIp =
            (typeof req.headers["x-forwarded-for"] === "string"
                ? req.headers["x-forwarded-for"].split(",")[0]?.trim()
                : undefined) || req.socket.remoteAddress || undefined;

        try {
            const { metaData, internalData } = mergeIdpLoginMetadata(account, {
                clientId,
                scope: typeof interaction.params?.scope === "string" ? interaction.params.scope : undefined,
                loginIp,
                userAgent: req.headers["user-agent"],
                timestamp: nowIso,
            });

            await wds.users.updateUser(account.id, {
                metaData,
                internalData,
            });
        } catch (metadataError) {
            console.warn("Failed to update WildDuck metadata", metadataError);
        }

        await provider.interactionFinished(
            req,
            res,
            {
                login: {
                    accountId: account.id,
                    acr: "urn:solutrix:loa:password",
                    amr: ["pwd"],
                    remember: true,
                    ts: Math.floor(Date.now() / 1000),
                },
            },
            { mergeWithLastSubmission: false },
        );
    } catch (error) {
        console.error("login_wd error", error);
        res.status(500).json({ error: "authentication_failed" });
    }
};

/**
 * Abort the current interaction.
 *
 * @param req - Express request object.
 * @param res - Response returning a redirect with access denied error.
 */
export const abortInteraction = async (req: Request, res: Response): Promise<void> => {
    try {
        const provider = await getProvider();
        await provider.interactionDetails(req, res);

        await provider.interactionFinished(
            req,
            res,
            {
                error: "access_denied",
                error_description: "End-User aborted the interaction",
            },
            { mergeWithLastSubmission: false },
        );
    } catch (error) {
        console.error("abortInteraction error", error);
        res.status(500).json({ error: "interaction_abort_failed" });
    }
};

/**
 * Handle explicit consent approval.
 */
export const confirmConsent = async (req: Request, res: Response): Promise<void> => {
    try {
        const provider = await getProvider();
        const interaction = await provider.interactionDetails(req, res);
        const accountId = interaction.session?.accountId;
        const grantId = await ensureGrant(provider, interaction, accountId);

        await provider.interactionFinished(
            req,
            res,
            {
                consent: grantId ? { grantId } : {},
            },
            { mergeWithLastSubmission: true },
        );
    } catch (error) {
        console.error("confirmConsent error", error);
        res.status(500).json({ error: "consent_failed" });
    }
};
