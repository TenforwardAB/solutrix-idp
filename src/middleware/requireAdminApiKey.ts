import { type NextFunction, type Request, type Response } from "express";

const HEADER_NAME = (process.env.ADMIN_API_KEY_HEADER ?? "x-admin-api-key").toLowerCase();
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

/**
 * Guard middleware that requires clients to present the configured admin API key.
 */
export const requireAdminApiKey = (req: Request, res: Response, next: NextFunction): void => {
    if (!ADMIN_API_KEY) {
        res.status(500).json({ error: "admin_api_key_not_configured" });
        return;
    }

    const provided = req.header(HEADER_NAME) ?? req.header(HEADER_NAME.toUpperCase());
    if (provided !== ADMIN_API_KEY) {
        res.status(401).json({ error: "invalid_admin_api_key" });
        return;
    }

    next();
};

export default requireAdminApiKey;
