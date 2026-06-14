import { Buffer } from "node:buffer";
import crypto from "node:crypto";
import { type NextFunction, type Request, type Response } from "express";

const digest = (value: string): Buffer => crypto.createHash("sha256").update(value, "utf8").digest();

const constantTimeEquals = (left: string, right: string): boolean =>
    crypto.timingSafeEqual(digest(left), digest(right));

/**
 * Simple HTTP Basic auth guard using MASTER_USER / MASTER_PASSWORD.
 */
export const masterPasswordAuth = (req: Request, res: Response, next: NextFunction): void => {
    const masterUser = process.env.MASTER_USER;
    const masterPassword = process.env.MASTER_PASSWORD;

    if (!masterUser || !masterPassword) {
        res.status(500).json({ error: "master_credentials_not_configured" });
        return;
    }

    const header = req.headers.authorization;
    if (!header || !header.toLowerCase().startsWith("basic ")) {
        res.setHeader("WWW-Authenticate", "Basic realm=\"idp-gui\"");
        res.status(401).json({ error: "unauthorized" });
        return;
    }

    const base64 = header.slice("basic ".length);
    let decoded: string;
    try {
        decoded = Buffer.from(base64, "base64").toString("utf8");
    } catch {
        res.status(401).json({ error: "unauthorized" });
        return;
    }

    const [user, ...rest] = decoded.split(":");
    const password = rest.join(":");

    if (!constantTimeEquals(user, masterUser) || !constantTimeEquals(password, masterPassword)) {
        res.status(401).json({ error: "unauthorized" });
        return;
    }

    next();
};

export default masterPasswordAuth;
