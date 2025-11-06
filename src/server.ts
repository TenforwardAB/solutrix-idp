import cors from "cors";
import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import getProvider from "./oidc/provider.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

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

    const provider = await getProvider();

    app.use("/api/global/admin", adminRoutes);
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
