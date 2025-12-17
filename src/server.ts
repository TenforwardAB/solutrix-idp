import cors from "cors";
import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import getProvider from "./oidc/provider.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import requireAdminApiKey from "./middleware/requireAdminApiKey.js";

dotenv.config();

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
