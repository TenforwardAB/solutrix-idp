import { Request, Response } from "express";
import getProvider from "../oidc/provider.js";
import {
    authenticateWildDuckUser,
    fetchWildDuckAccount,
    mergeIdpLoginMetadata,
} from "../services/wildduckUserService.js";
import { wds } from "../config/db.js";
import type { Provider } from "oidc-provider";

type InteractionDetails = Awaited<ReturnType<Provider["interactionDetails"]>>;

const escapeHtml = (value?: string): string => {
    if (!value) {
        return "";
    }
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

const renderLoginTemplate = (options: {
    uid: string;
    clientName: string;
    scope?: string;
    username?: string;
    error?: string;
}): string => {
    const { uid, clientName, scope, username, error } = options;
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(clientName)} &middot; Sign in</title>
    <style>
        :root {
            color-scheme: light dark;
        }

        body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            display: flex;
            min-height: 100vh;
            margin: 0;
            align-items: center;
            justify-content: center;
            background: #0b1929;
            background: radial-gradient(circle at 10% 20%, #1b2530 0%, #0b1929 90%);
        }

        main {
            background: rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 32px;
            width: min(420px, calc(100% - 32px));
            box-shadow: 0 18px 40px rgba(11, 25, 41, 0.35);
            backdrop-filter: blur(18px);
            color: #f6f7fb;
        }

        h1 {
            margin-top: 0;
            font-size: 1.75rem;
            font-weight: 600;
        }

        p.scope {
            opacity: 0.75;
            font-size: 0.9rem;
            margin-bottom: 24px;
        }

        form {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        label {
            display: flex;
            flex-direction: column;
            gap: 6px;
            font-weight: 500;
        }

        input {
            padding: 12px;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            background: rgba(11, 25, 41, 0.5);
            color: inherit;
            font-size: 1rem;
        }

        input:focus {
            outline: 2px solid rgba(83, 187, 255, 0.6);
            outline-offset: 1px;
        }

        button {
            padding: 12px 16px;
            background: linear-gradient(135deg, #4cc2ff 0%, #5777ff 100%);
            color: #0b1929;
            border: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: transform 120ms ease, box-shadow 120ms ease;
        }

        button:hover {
            transform: translateY(-1px);
            box-shadow: 0 8px 18px rgba(87, 119, 255, 0.3);
        }

        .error {
            background: rgba(255, 85, 89, 0.18);
            border: 1px solid rgba(255, 85, 89, 0.4);
            color: #ff8587;
            padding: 12px 14px;
            border-radius: 10px;
        }

        .footer {
            margin-top: 24px;
            font-size: 0.8rem;
            opacity: 0.5;
            text-align: center;
        }
    </style>
</head>
<body>
<main>
    <h1>${escapeHtml(clientName)}</h1>
    ${scope ? `<p class="scope">Requesting: ${escapeHtml(scope)}</p>` : ""}
    ${error ? `<div class="error">${escapeHtml(error)}</div>` : ""}
    <form method="post" action="/interaction/${encodeURIComponent(uid)}/login">
        <input type="hidden" name="uid" value="${escapeHtml(uid)}" />
        <label>
            Email address
            <input type="email" name="username" autocomplete="username" required value="${escapeHtml(username)}" />
        </label>
        <label>
            Password
            <input type="password" name="password" autocomplete="current-password" required />
        </label>
        <button type="submit">Continue</button>
    </form>
    <div class="footer">Solutrix Identity Provider</div>
</main>
</body>
</html>`;
};

const renderLoginView = async (
    provider: Provider,
    res: Response,
    interaction: InteractionDetails,
    options?: { error?: string; username?: string; status?: number },
) => {
    const clientId = interaction.params?.client_id as string | undefined;
    const client = clientId ? await provider.Client.find(clientId) : undefined;

    const username =
        options?.username ??
        (interaction.lastSubmission && typeof interaction.lastSubmission.login === "object"
            ? interaction.lastSubmission.login.login_hint
            : undefined) ??
        (typeof interaction.params?.login_hint === "string" ? interaction.params.login_hint : undefined);

    const html = renderLoginTemplate({
        uid: interaction.uid,
        clientName: client?.metadata?.client_name || clientId || "OIDC Client",
        scope: typeof interaction.params?.scope === "string" ? interaction.params.scope : undefined,
        username,
        error: options?.error,
    });

    res.status(options?.status ?? 200).type("html").send(html);
};

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

export const showInteraction = async (req: Request, res: Response): Promise<void> => {
    try {
        const provider = await getProvider();
        const interaction = await provider.interactionDetails(req, res);

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

        await renderLoginView(provider, res, interaction);
    } catch (error) {
        console.error("Failed to render interaction", error);
        res.status(500).json({ error: "interaction_error" });
    }
};

export const login_wd = async (req: Request, res: Response): Promise<void> => {
    try {
        const provider = await getProvider();
        const interaction = await provider.interactionDetails(req, res);

        if (interaction.prompt?.name && interaction.prompt.name !== "login") {
            res.redirect(`/interaction/${encodeURIComponent(interaction.uid)}`);
            return;
        }

        const username = typeof req.body.username === "string" ? req.body.username.trim() : "";
        const password = typeof req.body.password === "string" ? req.body.password : "";

        if (!username || !password) {
            await renderLoginView(provider, res, interaction, {
                error: "Username and password are required.",
                username,
                status: 400,
            });
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
            });
            return;
        }

        const account = await fetchWildDuckAccount(userId);

        if (!account.activated || account.suspended || account.disabled) {
            await renderLoginView(provider, res, interaction, {
                error: "Account is not active. Contact the administrator.",
                username,
                status: 403,
            });
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

        const grantId = await ensureGrant(provider, interaction, account.id);

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
                consent: grantId ? { grantId } : {},
                meta: {
                    wildduck: {
                        email: account.email,
                        customer_id: account.internalData?.cid,
                    },
                },
            },
            { mergeWithLastSubmission: false },
        );
    } catch (error) {
        console.error("login_wd error", error);
        res.status(500).json({ error: "authentication_failed" });
    }
};

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
