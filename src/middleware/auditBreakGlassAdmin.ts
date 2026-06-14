import { type NextFunction, type Request, type Response } from "express";
import { logAdminAuditEvent } from "../services/adminAuditService.js";

export const auditBreakGlassAdmin = (req: Request, res: Response, next: NextFunction): void => {
    res.on("finish", () => {
        void logAdminAuditEvent(req, {
            subject: process.env.MASTER_USER ?? "break-glass",
            authType: "break_glass",
        }, {
            action: `${req.method} ${req.originalUrl}`,
            targetType: "admin_route",
            metadata: { statusCode: res.statusCode },
        });
    });
    next();
};

export default auditBreakGlassAdmin;
