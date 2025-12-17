import cors from "cors";
import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import getProvider from "./oidc/provider.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import requireAdminApiKey from "./middleware/requireAdminApiKey.js";
import masterPasswordAuth from "./middleware/masterPasswordAuth.js";

dotenv.config();
const enableGui = (process.env.ENABLE_GUI ?? "false").toLowerCase() === "true";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const parseCorsOrigins = (): cors.CorsOptions["origin"] => {
    const originsEnv = process.env.CORS_ORIGINS;
    if (!originsEnv) {
        return false;
    }
    const origins = originsEnv
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
    return origins.length === 0 ? false : origins;
};

const bootstrap = async (): Promise<void> => {
    const app = express();
    app.disable("x-powered-by");
    app.set("trust proxy", true);

    app.use(
        cors({
            origin: parseCorsOrigins(),
            credentials: true,
        }),
    );

    app.use(morgan(process.env.HTTP_LOGGER_FORMAT || "combined"));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(express.static(path.join(__dirname, "..", "public")));
    app.get("/favicon.ico", (_req, res) => {
        res.sendFile(path.join(__dirname, "..", "public", "favicon.png"));
    });

    const swaggerSpec = {
        openapi: "3.0.3",
        info: {
            title: "Solutrix Identity Provider Admin API",
            description:
                "Administrative endpoints for managing OIDC clients, SAML service providers, identity policies, and signing keys.",
            version: "1.0.0",
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 8080}`,
                description: "Local development server",
            },
        ],
        tags: [
            { name: "Admin Clients", description: "Manage OIDC/OAuth clients." },
            { name: "Admin Policies", description: "Manage identity and token exchange policies." },
            { name: "Admin SAML", description: "Manage SAML service providers." },
            { name: "Admin Keys", description: "Manage signing keys." },
        ],
            components: {
                securitySchemes: {
                    basicAuth: {
                        type: "http",
                        scheme: "basic",
                        description: "Basic authentication using client credentials.",
                    },
                    bearerAuth: {
                        type: "http",
                        scheme: "bearer",
                        bearerFormat: "JWT",
                        description: "Access token issued by the authorization server.",
                    },
                },
            schemas: {
                AdminClient: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        client_id: { type: "string" },
                        name: { type: "string" },
                        redirect_uris: {
                            type: "array",
                            items: { type: "string", format: "uri" },
                        },
                        grant_types: {
                            type: "array",
                            items: { type: "string" },
                        },
                        scopes: {
                            type: "array",
                            items: { type: "string" },
                        },
                    },
                },
                AdminClientWithSecret: {
                    allOf: [
                        { $ref: "#/components/schemas/AdminClient" },
                        {
                            type: "object",
                            properties: {
                                client_secret: { type: "string" },
                            },
                        },
                    ],
                },
                AdminClientOptionalSecret: {
                    allOf: [
                        { $ref: "#/components/schemas/AdminClient" },
                        {
                            type: "object",
                            properties: {
                                client_secret: { type: "string", nullable: true },
                            },
                        },
                    ],
                },
                CreateAdminClientRequest: {
                    type: "object",
                    required: ["name", "redirect_uris", "grant_types", "scopes"],
                    properties: {
                        name: { type: "string" },
                        redirect_uris: {
                            type: "array",
                            items: { type: "string", format: "uri" },
                        },
                        grant_types: {
                            type: "array",
                            items: { type: "string" },
                        },
                        scopes: {
                            type: "array",
                            items: { type: "string" },
                        },
                    },
                },
                UpdateAdminClientRequest: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        redirect_uris: {
                            type: "array",
                            items: { type: "string", format: "uri" },
                        },
                        grant_types: {
                            type: "array",
                            items: { type: "string" },
                        },
                        scopes: {
                            type: "array",
                            items: { type: "string" },
                        },
                        rotate_secret: { type: "boolean" },
                    },
                },
                SamlServiceProvider: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        entityId: { type: "string" },
                        metadataXml: { type: "string" },
                        acsEndpoints: {
                            type: "array",
                            items: { type: "string", format: "uri" },
                        },
                        binding: { type: "string" },
                        attributeMapping: {
                            type: "object",
                            additionalProperties: true,
                        },
                    },
                },
                CreateSamlServiceProviderRequest: {
                    type: "object",
                    required: ["entity_id", "acs", "binding"],
                    properties: {
                        entity_id: { type: "string" },
                        metadata_xml: { type: "string", nullable: true },
                        acs: {
                            type: "array",
                            items: { type: "string", format: "uri" },
                        },
                        binding: { type: "string" },
                        attr_mapping: {
                            type: "object",
                            additionalProperties: true,
                        },
                    },
                },
                UpdateSamlServiceProviderRequest: {
                    type: "object",
                    properties: {
                        entity_id: { type: "string" },
                        metadata_xml: { type: "string" },
                        acs: {
                            type: "array",
                            items: { type: "string", format: "uri" },
                        },
                        binding: { type: "string" },
                        attr_mapping: {
                            type: "object",
                            additionalProperties: true,
                        },
                    },
                },
                SigningKey: {
                    type: "object",
                    properties: {
                        key_id: { type: "string" },
                        public_key: { type: "string" },
                        created_at: { type: "string", format: "date-time" },
                    },
                },
                IdentityPolicy: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        targetType: { type: "string" },
                        targetId: { type: "string", nullable: true },
                        policy: {
                            type: "object",
                            additionalProperties: true,
                        },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                CreatePolicyRequest: {
                    type: "object",
                    required: ["name", "target_type"],
                    properties: {
                        name: { type: "string" },
                        target_type: { type: "string" },
                        target_id: { type: "string", nullable: true },
                        policy: {
                            type: "object",
                            additionalProperties: true,
                        },
                    },
                },
                UpdatePolicyRequest: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        target_type: { type: "string" },
                        target_id: { type: "string", nullable: true },
                        policy: {
                            type: "object",
                            additionalProperties: true,
                        },
                    },
                },
            },
        },
        paths: {
            "/api/global/admin/clients": {
                get: {
                    summary: "List registered OIDC/OAuth clients.",
                    tags: ["Admin Clients"],
                    responses: {
                        200: {
                            description: "A list of clients.",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "array",
                                        items: { $ref: "#/components/schemas/AdminClient" },
                                    },
                                },
                            },
                        },
                    },
                },
                post: {
                    summary: "Create a new client.",
                    tags: ["Admin Clients"],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/CreateAdminClientRequest" },
                            },
                        },
                    },
                    responses: {
                        201: {
                            description: "Client created successfully.",
                            content: {
                                "application/json": {
                                    schema: { $ref: "#/components/schemas/AdminClientWithSecret" },
                                },
                            },
                        },
                        400: { description: "Invalid payload." },
                    },
                },
            },
            "/api/global/admin/clients/{id}": {
                get: {
                    summary: "Retrieve a specific client.",
                    tags: ["Admin Clients"],
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string" },
                        },
                    ],
                    responses: {
                        200: {
                            description: "The client details.",
                            content: {
                                "application/json": {
                                    schema: { $ref: "#/components/schemas/AdminClient" },
                                },
                            },
                        },
                        404: { description: "Client not found." },
                    },
                },
                put: {
                    summary: "Update an existing client.",
                    tags: ["Admin Clients"],
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string" },
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/UpdateAdminClientRequest" },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: "Updated client.",
                            content: {
                                "application/json": {
                                    schema: { $ref: "#/components/schemas/AdminClientOptionalSecret" },
                                },
                            },
                        },
                        400: { description: "Invalid payload." },
                        404: { description: "Client not found." },
                    },
                },
                delete: {
                    summary: "Delete a client.",
                    tags: ["Admin Clients"],
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string" },
                        },
                    ],
                    responses: {
                        204: { description: "Client deleted." },
                        404: { description: "Client not found." },
                    },
                },
            },
            "/api/global/admin/sps": {
                get: {
                    summary: "List SAML service providers.",
                    tags: ["Admin SAML"],
                    responses: {
                        200: {
                            description: "Array of service providers.",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "array",
                                        items: { $ref: "#/components/schemas/SamlServiceProvider" },
                                    },
                                },
                            },
                        },
                    },
                },
                post: {
                    summary: "Create a SAML service provider.",
                    tags: ["Admin SAML"],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/CreateSamlServiceProviderRequest" },
                            },
                        },
                    },
                    responses: {
                        201: {
                            description: "Service provider created.",
                            content: {
                                "application/json": {
                                    schema: { $ref: "#/components/schemas/SamlServiceProvider" },
                                },
                            },
                        },
                        400: { description: "Invalid payload." },
                    },
                },
            },
            "/api/global/admin/sps/{id}": {
                get: {
                    summary: "Retrieve a SAML service provider.",
                    tags: ["Admin SAML"],
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string" },
                        },
                    ],
                    responses: {
                        200: {
                            description: "Service provider record.",
                            content: {
                                "application/json": {
                                    schema: { $ref: "#/components/schemas/SamlServiceProvider" },
                                },
                            },
                        },
                        404: { description: "Service provider not found." },
                    },
                },
                put: {
                    summary: "Update a SAML service provider.",
                    tags: ["Admin SAML"],
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string" },
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/UpdateSamlServiceProviderRequest" },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: "Updated service provider.",
                            content: {
                                "application/json": {
                                    schema: { $ref: "#/components/schemas/SamlServiceProvider" },
                                },
                            },
                        },
                        400: { description: "Invalid payload." },
                        404: { description: "Service provider not found." },
                    },
                },
                delete: {
                    summary: "Delete a SAML service provider.",
                    tags: ["Admin SAML"],
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string" },
                        },
                    ],
                    responses: {
                        204: { description: "Service provider deleted." },
                        404: { description: "Service provider not found." },
                    },
                },
            },
            "/api/global/admin/keys/rotate": {
                post: {
                    summary: "Rotate RSA signing keys.",
                    tags: ["Admin Keys"],
                    responses: {
                        201: {
                            description: "New signing key generated.",
                            content: {
                                "application/json": {
                                    schema: { $ref: "#/components/schemas/SigningKey" },
                                },
                            },
                        },
                    },
                },
            },
            "/api/global/admin/policies": {
                get: {
                    summary: "List identity policies.",
                    tags: ["Admin Policies"],
                    responses: {
                        200: {
                            description: "Array of policies.",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "array",
                                        items: { $ref: "#/components/schemas/IdentityPolicy" },
                                    },
                                },
                            },
                        },
                    },
                },
                post: {
                    summary: "Create a policy.",
                    tags: ["Admin Policies"],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/CreatePolicyRequest" },
                            },
                        },
                    },
                    responses: {
                        201: {
                            description: "Policy created.",
                            content: {
                                "application/json": {
                                    schema: { $ref: "#/components/schemas/IdentityPolicy" },
                                },
                            },
                        },
                        400: { description: "Invalid payload." },
                    },
                },
            },
            "/api/global/admin/policies/{id}": {
                get: {
                    summary: "Retrieve a policy by id.",
                    tags: ["Admin Policies"],
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string" },
                        },
                    ],
                    responses: {
                        200: {
                            description: "Policy details.",
                            content: {
                                "application/json": {
                                    schema: { $ref: "#/components/schemas/IdentityPolicy" },
                                },
                            },
                        },
                        404: { description: "Policy not found." },
                    },
                },
                put: {
                    summary: "Update a policy.",
                    tags: ["Admin Policies"],
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string" },
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/UpdatePolicyRequest" },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: "Updated policy.",
                            content: {
                                "application/json": {
                                    schema: { $ref: "#/components/schemas/IdentityPolicy" },
                                },
                            },
                        },
                        400: { description: "Invalid payload." },
                        404: { description: "Policy not found." },
                    },
                },
                delete: {
                    summary: "Delete a policy.",
                    tags: ["Admin Policies"],
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string" },
                        },
                    ],
                    responses: {
                        204: { description: "Policy deleted." },
                        404: { description: "Policy not found." },
                    },
                },
            },
            "/oauth/authorize": {
                get: {
                    summary: "Authorization Endpoint",
                    description:
                        "Initiates the Authorization Code flow with PKCE. Redirects either to `/interaction/:uid` or the client's registered redirect URI.",
                    tags: ["OIDC"],
                    parameters: [
                        { in: "query", name: "client_id", schema: { type: "string" }, required: true },
                        { in: "query", name: "redirect_uri", schema: { type: "string", format: "uri" }, required: true },
                        { in: "query", name: "response_type", schema: { type: "string" }, required: true },
                        { in: "query", name: "scope", schema: { type: "string" }, required: true },
                        { in: "query", name: "state", schema: { type: "string" } },
                        { in: "query", name: "code_challenge", schema: { type: "string" } },
                        {
                            in: "query",
                            name: "code_challenge_method",
                            schema: { type: "string", enum: ["S256"] },
                        },
                        { in: "query", name: "prompt", schema: { type: "string" } },
                        { in: "query", name: "login_hint", schema: { type: "string" } },
                        { in: "query", name: "nonce", schema: { type: "string" } },
                    ],
                    responses: {
                        302: {
                            description: "Redirect to interaction or client callback.",
                            headers: { Location: { schema: { type: "string" } } },
                        },
                        400: { description: "Invalid request." },
                    },
                },
            },
            "/oauth/token": {
                post: {
                    summary: "Token Endpoint",
                    description:
                        "Issues tokens for `authorization_code`, `refresh_token`, `client_credentials`, and token exchange grants.",
                    tags: ["OIDC"],
                    requestBody: {
                        required: true,
                        content: {
                            "application/x-www-form-urlencoded": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        grant_type: { type: "string" },
                                        code: { type: "string" },
                                        redirect_uri: { type: "string", format: "uri" },
                                        code_verifier: { type: "string" },
                                        refresh_token: { type: "string" },
                                        client_id: { type: "string" },
                                        client_secret: { type: "string" },
                                        scope: { type: "string" },
                                        audience: { type: "string" },
                                        resource: { type: "string" },
                                        subject_token: { type: "string" },
                                        subject_token_type: { type: "string" },
                                        actor_token: { type: "string" },
                                        actor_token_type: { type: "string" },
                                        requested_token_type: { type: "string" },
                                    },
                                    required: ["grant_type"],
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: "Token response.",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            access_token: { type: "string" },
                                            token_type: { type: "string" },
                                            expires_in: { type: "integer" },
                                            refresh_token: { type: "string" },
                                            id_token: { type: "string" },
                                            scope: { type: "string" },
                                        },
                                    },
                                },
                            },
                        },
                        400: { description: "Invalid grant request." },
                        401: { description: "Client authentication failed." },
                    },
                },
            },
            "/oauth/jwks.json": {
                get: {
                    summary: "JWKS Endpoint",
                    description: "Returns the JSON Web Key Set used to verify ID tokens and other JWT artifacts.",
                    tags: ["OIDC"],
                    responses: {
                        200: {
                            description: "JWKS document.",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            keys: {
                                                type: "array",
                                                items: {
                                                    type: "object",
                                                    properties: {
                                                        kid: { type: "string" },
                                                        kty: { type: "string" },
                                                        alg: { type: "string" },
                                                        use: { type: "string" },
                                                        n: { type: "string" },
                                                        e: { type: "string" },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            "/userinfo": {
                get: {
                    summary: "UserInfo Endpoint",
                    description: "Returns claims about the authenticated End-User. Requires a valid access token.",
                    tags: ["OIDC"],
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: "User claims.",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        additionalProperties: true,
                                        example: {
                                            sub: "user-id",
                                            email: "user@example.com",
                                            email_verified: true,
                                            preferred_username: "user",
                                        },
                                    },
                                },
                            },
                        },
                        401: { description: "Missing or invalid access token." },
                    },
                },
                post: {
                    summary: "UserInfo Endpoint (POST)",
                    description: "Same as GET /userinfo but accepts the access token in the request body.",
                    tags: ["OIDC"],
                    requestBody: {
                        required: true,
                        content: {
                            "application/x-www-form-urlencoded": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        access_token: { type: "string" },
                                    },
                                    required: ["access_token"],
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: "User claims.",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        additionalProperties: true,
                                    },
                                },
                            },
                        },
                        401: { description: "Missing or invalid access token." },
                    },
                },
            },
            "/oauth/introspect": {
                post: {
                    summary: "Token Introspection",
                    description: "Validates opaque access or refresh tokens. Requires client authentication.",
                    tags: ["OIDC"],
                    requestBody: {
                        required: true,
                        content: {
                            "application/x-www-form-urlencoded": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        token: { type: "string" },
                                        token_type_hint: {
                                            type: "string",
                                            enum: ["access_token", "refresh_token"],
                                        },
                                    },
                                    required: ["token"],
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: "Introspection result.",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            active: { type: "boolean" },
                                            scope: { type: "string" },
                                            client_id: { type: "string" },
                                            username: { type: "string" },
                                            token_type: { type: "string" },
                                            exp: { type: "integer" },
                                            iat: { type: "integer" },
                                            nbf: { type: "integer" },
                                            sub: { type: "string" },
                                            aud: { type: "string" },
                                            iss: { type: "string" },
                                        },
                                    },
                                },
                            },
                        },
                        401: { description: "Invalid client authentication." },
                    },
                },
            },
            "/oauth/revoke": {
                post: {
                    summary: "Token Revocation",
                    description: "Revokes refresh or access tokens. Requires client authentication.",
                    tags: ["OIDC"],
                    requestBody: {
                        required: true,
                        content: {
                            "application/x-www-form-urlencoded": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        token: { type: "string" },
                                    },
                                    required: ["token"],
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: "Token revocation acknowledged." },
                        401: { description: "Invalid client authentication." },
                    },
                },
            },
            "/oauth/logout": {
                get: {
                    summary: "End Session Endpoint",
                    description:
                        "Initiates RP-Initiated Logout, clearing the session and redirecting to the provided URI if allowed.",
                    tags: ["OIDC"],
                    parameters: [
                        { in: "query", name: "id_token_hint", schema: { type: "string" } },
                        { in: "query", name: "post_logout_redirect_uri", schema: { type: "string", format: "uri" } },
                        { in: "query", name: "state", schema: { type: "string" } },
                    ],
                    responses: {
                        302: {
                            description: "Redirect to post-logout URI or default confirmation page.",
                            headers: { Location: { schema: { type: "string" } } },
                        },
                        400: { description: "Invalid logout request." },
                    },
                },
            },
        },
    } as const;

    app.get("/docs.json", (_req, res) => {
        res.json(swaggerSpec);
    });

    app.get("/docs", (_req, res) => {
        res.type("html").send(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Solutrix IDP Admin API</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      SwaggerUIBundle({
        url: '/docs.json',
        dom_id: '#swagger-ui',
      });
    </script>
  </body>
</html>`);
    });

    const provider = await getProvider();

    app.use("/api/global/admin", requireAdminApiKey, adminRoutes);

    if (enableGui) {
        const guiPageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Solutrix IDP Admin GUI</title>
  <style>
    :root { color-scheme: light; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
    body { margin: 0; background: #f7f9fc; color: #0f172a; }
    header { background: linear-gradient(135deg, #0ea5e9, #6366f1); color: #fff; padding: 20px 28px; box-shadow: 0 4px 18px rgba(0,0,0,0.12); }
    main { max-width: 1100px; margin: 20px auto; padding: 0 20px 40px; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; box-shadow: 0 10px 30px rgba(15,23,42,0.08); padding: 20px; }
    label { display: block; font-weight: 600; margin: 12px 0 6px; }
    input, select, textarea { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 14px; background: #f8fafc; }
    textarea { min-height: 120px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; }
    button { background: linear-gradient(135deg, #0ea5e9, #6366f1); color: #fff; border: none; padding: 12px 16px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: transform 0.1s ease, box-shadow 0.2s ease; }
    button:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(99,102,241,0.35); }
    pre { background: #0f172a; color: #e2e8f0; padding: 14px; border-radius: 12px; overflow-x: auto; border: 1px solid #1e293b; }
    .row { display: grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap: 14px; }
    .muted { color: #475569; font-size: 13px; }
    .badge { display: inline-block; padding: 4px 8px; background: #e2e8f0; border-radius: 999px; font-size: 12px; font-weight: 600; }
    .hidden { display: none; }
  </style>
</head>
<body>
  <header>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;">
      <div>
        <div class="badge">DEV GUI</div>
        <h1 style="margin:6px 0 2px;font-size:22px;">Solutrix IDP Admin</h1>
        <p style="margin:0;font-size:14px;opacity:0.88;">Manage Clients, Policies, and SAML SPs.</p>
      </div>
      <div style="text-align:right;font-size:12px;opacity:0.85;">Protected by MASTER_USER / MASTER_PASSWORD</div>
    </div>
  </header>
  <main>
    <div class="card" id="panel">
      <div class="row">
        <div>
          <label for="resource">Resource</label>
          <select id="resource">
            <option value="clients">Clients</option>
            <option value="policies">Policies</option>
            <option value="sps">Service Providers</option>
          </select>
        </div>
        <div>
          <label for="operation">Operation</label>
          <select id="operation">
            <option value="list">List</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
          </select>
        </div>
        <div>
          <label for="recordId">Record ID (for update/delete)</label>
          <input id="recordId" placeholder="UUID / database id" />
        </div>
      </div>

      <div id="form-clients" class="">
        <div class="row">
          <div><label>Name</label><input id="client_name" placeholder="example-app" /></div>
          <div><label>Client Secret (optional for update)</label><input id="client_secret" placeholder="auto if empty" /></div>
        </div>
        <label>Redirect URIs (one per line)</label>
        <textarea id="client_redirects" placeholder="http://localhost:3000/callback"></textarea>
        <label>Post-logout Redirect URIs (one per line)</label>
        <textarea id="client_post_logout" placeholder="http://localhost:5173/"></textarea>
        <label>Grant Types (one per line)</label>
        <textarea id="client_grants" placeholder="authorization_code&#10;refresh_token"></textarea>
        <label>Scopes (one per line)</label>
        <textarea id="client_scopes" placeholder="openid&#10;profile&#10;email"></textarea>
      </div>

      <div id="form-policies" class="hidden">
        <div class="row">
          <div><label>Name</label><input id="policy_name" placeholder="require-2fa" /></div>
          <div><label>Target Type</label><input id="policy_target_type" placeholder="client|user|service" /></div>
          <div><label>Target ID (optional)</label><input id="policy_target_id" placeholder="client-id or user-id" /></div>
        </div>
        <label>Policy JSON</label>
        <textarea id="policy_body" placeholder='{\"rule\":\"allow\"}'></textarea>
      </div>

      <div id="form-sps" class="hidden">
        <div class="row">
          <div><label>Entity ID</label><input id="sp_entity" placeholder="urn:example:sp" /></div>
          <div><label>Binding</label><input id="sp_binding" placeholder="post|redirect" /></div>
        </div>
        <label>ACS Endpoints (one per line)</label>
        <textarea id="sp_acs" placeholder="https://app.example.com/saml/acs"></textarea>
        <label>Metadata XML (optional)</label>
        <textarea id="sp_metadata" placeholder="<EntityDescriptor>...</EntityDescriptor>"></textarea>
        <label>Attribute Mapping JSON</label>
        <textarea id="sp_attrs" placeholder='{\"email\":\"mail\",\"name\":\"displayName\"}'></textarea>
      </div>

      <div class="row" style="align-items:center;margin-top:12px;">
        <div>
          <label for="username">MASTER_USER</label>
          <input id="username" value="${process.env.MASTER_USER ?? "idp_admin"}" />
        </div>
        <div>
          <label for="password">MASTER_PASSWORD</label>
          <input id="password" type="password" placeholder="Enter master password" />
        </div>
        <div style="align-self:flex-end;">
          <button id="run">Run</button>
        </div>
      </div>
    </div>

    <div style="margin-top:20px;" class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;">
        <h3 style="margin:0;">Result</h3>
        <div class="muted">Requests hit /gui/api (master auth).</div>
      </div>
      <pre id="output">Awaiting action...</pre>
    </div>
  </main>
  <script>
    const resource = document.getElementById('resource');
    const operation = document.getElementById('operation');
    const recordId = document.getElementById('recordId');
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    const output = document.getElementById('output');
    const runBtn = document.getElementById('run');

    const forms = {
      clients: document.getElementById('form-clients'),
      policies: document.getElementById('form-policies'),
      sps: document.getElementById('form-sps'),
    };

    const showForm = () => {
      const res = resource.value;
      Object.entries(forms).forEach(([key, el]) => {
        if (el) el.classList.toggle('hidden', key !== res);
      });
    };
    resource.addEventListener('change', showForm);
    showForm();

    const setOutput = (value) => {
      output.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    };

    const buildAuthHeader = () => {
      const u = username.value || '';
      const p = password.value || '';
      return 'Basic ' + btoa(u + ':' + p);
    };

    const splitLines = (value) => value.split(/\\r?\\n/).map((v) => v.trim()).filter(Boolean);

    const buildPayload = () => {
      const res = resource.value;
      if (res === 'clients') {
        const redirects = splitLines(document.getElementById('client_redirects').value);
        const postLogout = splitLines(document.getElementById('client_post_logout').value);
        const grants = splitLines(document.getElementById('client_grants').value);
        const scopes = splitLines(document.getElementById('client_scopes').value);
        const payload = {
          name: document.getElementById('client_name').value.trim() || undefined,
          client_secret: document.getElementById('client_secret').value.trim() || undefined,
          redirect_uris: redirects,
          post_logout_redirect_uris: postLogout,
          grant_types: grants,
          scopes,
        };
        Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
        return payload;
      }
      if (res === 'policies') {
        let policyJson = {};
        const raw = document.getElementById('policy_body').value.trim();
        if (raw) {
          try { policyJson = JSON.parse(raw); } catch (err) { throw new Error('Policy JSON invalid: ' + err); }
        }
        const payload = {
          name: document.getElementById('policy_name').value.trim() || undefined,
          target_type: document.getElementById('policy_target_type').value.trim() || undefined,
          target_id: document.getElementById('policy_target_id').value.trim() || undefined,
          policy: policyJson,
        };
        Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
        return payload;
      }
      if (res === 'sps') {
        let attrMap = {};
        const attrsRaw = document.getElementById('sp_attrs').value.trim();
        if (attrsRaw) {
          try { attrMap = JSON.parse(attrsRaw); } catch (err) { throw new Error('Attribute mapping JSON invalid: ' + err); }
        }
        const payload = {
          entity_id: document.getElementById('sp_entity').value.trim() || undefined,
          binding: document.getElementById('sp_binding').value.trim() || undefined,
          acs: splitLines(document.getElementById('sp_acs').value),
          metadata_xml: document.getElementById('sp_metadata').value.trim() || undefined,
          attr_mapping: attrMap,
        };
        Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
        return payload;
      }
      return {};
    };

    const callApi = async () => {
      const res = resource.value;
      const op = operation.value;
      const id = recordId.value.trim();
      let method = 'GET';
      let path = '/gui/api/' + res;
      let body;

      if (op === 'create') { method = 'POST'; body = buildPayload(); }
      if (op === 'update') { method = 'PUT'; path += id ? '/' + encodeURIComponent(id) : ''; body = buildPayload(); }
      if (op === 'delete') { method = 'DELETE'; path += id ? '/' + encodeURIComponent(id) : ''; }

      if ((op === 'update' || op === 'delete') && !id) {
        setOutput({ error: 'Record ID is required for update/delete' });
        return;
      }

      try {
        const response = await fetch(path, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': buildAuthHeader(),
          },
          body: body ? JSON.stringify(body) : undefined,
        });
        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch { data = text; }
        setOutput({ status: response.status, data });
      } catch (err) {
        setOutput({ error: 'Request failed', details: String(err) });
      }
    };

    runBtn.addEventListener('click', (e) => {
      e.preventDefault();
      try {
        callApi();
      } catch (err) {
        setOutput({ error: String(err) });
      }
    });
  </script>
</body>
</html>`;

        app.use("/gui/api", masterPasswordAuth, adminRoutes);
        app.get("/gui", masterPasswordAuth, (_req, res) => {
            res.type("html").send(guiPageHtml);
        });
    }
    app.use("/interaction", authRoutes);
    app.use(provider.callback());

    const port = Number(process.env.PORT || 8080);
    const host = process.env.HOST || "0.0.0.0";

    app.listen(port, host, () => {
        console.log(`Solutrix Identity Provider listening on http://${host}:${port}`);
    });
};

bootstrap().catch((error) => {
    console.error("Failed to start Solutrix Identity Provider", error);
    process.exit(1);
});
