import { Op } from "sequelize";
import models, { sequelize } from "../config/db.js";

type Payload = Record<string, any>;

const grantable = new Set([
    "AccessToken",
    "AuthorizationCode",
    "BackchannelAuthenticationRequest",
    "ClientCredentials",
    "DeviceCode",
    "RefreshToken",
    "Session",
]);

const ttlable = new Set([
    "AccessToken",
    "AuthorizationCode",
    "BackchannelAuthenticationRequest",
    "ClientCredentials",
    "DeviceCode",
    "RefreshToken",
    "Interaction",
    "Session",
    "Grant",
    "PushedAuthorizationRequest",
]);

const now = () => new Date();

class SequelizeAdapter {
    readonly name: string;

    constructor(name: string) {
        this.name = name;
    }

    static async connect(): Promise<void> {
        await sequelize.authenticate();
    }

    private collection() {
        return models.oidc_adapter_store;
    }

    private computeExpires(expiresIn?: number): Date | null {
        if (!expiresIn) {
            return null;
        }
        return new Date(Date.now() + expiresIn * 1000);
    }

    private async upsertEntry(id: string, payload: Payload, expiresAt: Date | null): Promise<void> {
        const storedPayload = { ...payload };
        const entry = {
            id,
            name: this.name,
            payload: storedPayload,
            grantId: storedPayload.grantId ?? null,
            userCode: storedPayload.userCode ?? null,
            uid: storedPayload.uid ?? null,
            expiresAt,
            consumedAt: null,
        };

        if (this.name === "Interaction") {
            console.log("[adapter:Interaction] upsert", {
                id,
                expiresAt: expiresAt?.toISOString() ?? null,
                keys: Object.keys(storedPayload),
            });
        }

        await this.collection().upsert(entry);
    }

    async upsert(id: string, payload: Payload, expiresIn?: number): Promise<void> {
        const expiresAt = this.computeExpires(expiresIn);
        await this.upsertEntry(id, payload, expiresAt);
    }

    private sanitize(entry: any): Payload | undefined {
        if (!entry) {
            return undefined;
        }

        const expiresAt: Date | null =
            typeof entry.get === "function" ? entry.get("expiresAt") : entry.expiresAt ?? null;

        if (expiresAt && expiresAt < now()) {
            if (this.name === "Interaction") {
                const entryId = typeof entry.get === "function" ? entry.get("id") : entry.id;
                console.warn("[adapter:Interaction] expired entry", entryId);
            }
            void entry.destroy();
            return undefined;
        }

        const rawPayload = typeof entry.get === "function" ? entry.get("payload") : entry.payload;
        const payload: Payload =
            typeof rawPayload === "string" ? JSON.parse(rawPayload) : { ...(rawPayload ?? {}) };
        // Ensure numeric fields remain numbers after round-trip serialization
        const numericFields = ["exp", "iat", "nbf", "auth_time"];
        for (const field of numericFields) {
            if (typeof payload[field] === "string" && payload[field] !== "") {
                const parsed = Number(payload[field]);
                payload[field] = Number.isFinite(parsed) ? parsed : payload[field];
            }
        }
        const consumedAt = typeof entry.get === "function" ? entry.get("consumedAt") : entry.consumedAt;
        if (consumedAt instanceof Date) {
            payload.consumed = consumedAt.getTime() / 1000;
        }
        if (this.name === "Interaction") {
            const entryId = typeof entry.get === "function" ? entry.get("id") : entry.id;
            const payloadKeys = Object.keys(payload);
            console.log("[adapter:Interaction] sanitize success", entryId, {
                keys: Object.keys(payload),
                kind: payload.kind,
                exp: payload.exp,
                expType: typeof payload.exp,
                iatType: typeof payload.iat,
            });
            if (payloadKeys.length === 0) {
                console.warn("[adapter:Interaction] empty payload", entryId, rawPayload);
            }
        }
        return payload;
    }

    async find(id: string): Promise<Payload | undefined> {
        const entry = await this.collection().findOne({ where: { id, name: this.name } });
        if (!entry && this.name === "Interaction") {
            console.warn("[adapter:Interaction] find miss", id);
        } else if (entry && this.name === "Interaction") {
            console.log("[adapter:Interaction] find hit", id);
        }
        return this.sanitize(entry);
    }

    async findByUserCode(userCode: string): Promise<Payload | undefined> {
        const entry = await this.collection().findOne({ where: { userCode, name: this.name } });
        return this.sanitize(entry);
    }

    async findByUid(uid: string): Promise<Payload | undefined> {
        const entry = await this.collection().findOne({ where: { uid, name: this.name } });
        return this.sanitize(entry);
    }

    async destroy(id: string): Promise<void> {
        await this.collection().destroy({ where: { id, name: this.name } });
    }

    async revokeByGrantId(grantId: string): Promise<void> {
        if (!grantable.has(this.name)) {
            return;
        }

        await this.collection().destroy({
            where: {
                grantId,
                name: {
                    [Op.in]: Array.from(grantable),
                },
            },
        });
    }

    async consume(id: string): Promise<void> {
        await this.collection().update({ consumedAt: now() }, { where: { id, name: this.name } });
    }

    async cleanExpired(): Promise<void> {
        await this.collection().destroy({
            where: {
                expiresAt: {
                    [Op.lt]: now(),
                },
            },
        });
    }

    async grantCleaner(grantId: string): Promise<void> {
        await this.collection().destroy({ where: { grantId } });
    }
}

export default SequelizeAdapter;
