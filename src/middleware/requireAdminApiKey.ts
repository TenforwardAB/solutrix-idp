import { type NextFunction, type Request, type Response } from "express";
import crypto from "node:crypto";

const HEADER_NAME = (process.env.ADMIN_API_KEY_HEADER ?? "x-admin-api-key").toLowerCase();
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
const ADMIN_API_ALLOWED_IPS = (process.env.ADMIN_API_ALLOWED_IPS ?? "")
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);

const digest = (value: string): Buffer => crypto.createHash("sha256").update(value, "utf8").digest();

const constantTimeEquals = (left: string, right: string): boolean =>
    crypto.timingSafeEqual(digest(left), digest(right));

const normalizeIp = (ip: string | undefined): string => (ip ?? "").replace(/^::ffff:/, "");

const isAllowedIp = (req: Request): boolean => {
    if (ADMIN_API_ALLOWED_IPS.length === 0) {
        return true;
    }
    const allowed = new Set(ADMIN_API_ALLOWED_IPS.map(normalizeIp));
    const candidates = [
        normalizeIp(req.ip),
        ...String(req.header("x-forwarded-for") ?? "")
            .split(",")
            .map((ip) => normalizeIp(ip.trim()))
            .filter(Boolean),
    ];
    return candidates.some((ip) => allowed.has(ip));
};

/**
 * Guard middleware that requires clients to present the configured admin API key.
 */
export const requireAdminApiKey = (req: Request, res: Response, next: NextFunction): void => {
    if (!ADMIN_API_KEY) {
        res.status(500).json({ error: "admin_api_key_not_configured" });
        return;
    }

    if (!isAllowedIp(req)) {
        console.warn("[break-glass-admin] denied request from disallowed ip", {
            ip: req.ip,
            path: req.originalUrl,
        });
        res.status(403).json({ error: "admin_ip_not_allowed" });
        return;
    }

    const provided = req.header(HEADER_NAME) ?? req.header(HEADER_NAME.toUpperCase());
    if (!provided || !constantTimeEquals(provided, ADMIN_API_KEY)) {
        console.warn("[break-glass-admin] invalid api key", {
            ip: req.ip,
            path: req.originalUrl,
        });
        res.status(401).json({ error: "invalid_admin_api_key" });
        return;
    }

    next();
};

export default requireAdminApiKey;
