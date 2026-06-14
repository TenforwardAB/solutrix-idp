import { type Request } from "express";
import models from "../config/db.js";

export type AdminAuditActor = {
    subject?: string;
    email?: string;
    customerId?: string;
    authType: "oidc" | "break_glass";
};

export const logAdminAuditEvent = async (
    req: Request,
    actor: AdminAuditActor,
    event: {
        action: string;
        targetType: string;
        targetId?: string;
        metadata?: Record<string, unknown>;
    },
): Promise<void> => {
    try {
        await models.admin_audit_events.create({
            actorSubject: actor.subject ?? null,
            actorEmail: actor.email ?? null,
            customerId: actor.customerId ?? null,
            action: event.action,
            targetType: event.targetType,
            targetId: event.targetId ?? null,
            authType: actor.authType,
            ip: req.ip ?? null,
            userAgent: req.header("user-agent") ?? null,
            metadata: event.metadata ?? {},
        });
    } catch (error) {
        console.error("Failed to write admin audit event", error);
    }
};
