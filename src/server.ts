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
import { renderAdminGuiPage } from "./views/pages/adminGui.ts";
import { renderSwaggerDocsPage } from "./views/pages/swaggerDocs.js";

dotenv.config();
const enableGui = (process.env.ENABLE_GUI ?? "false").toLowerCase() === "true";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const openapiJsonPath = path.join(__dirname, "..", "public", "openapi.json");

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

    app.get("/docs.json", (_req, res) => {
        res.sendFile(openapiJsonPath);
    });

    app.get("/docs", (_req, res) => {
        res.type("html").send(renderSwaggerDocsPage());
    });

    const provider = await getProvider();

    app.use("/api/global/admin", requireAdminApiKey, adminRoutes);

    if (enableGui) {
        const guiPageHtml = renderAdminGuiPage(process.env.MASTER_USER ?? "idp_admin");
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
