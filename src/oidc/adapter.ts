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

/**
 * Create a new Date object representing the current moment.
 */
const now = () => new Date();

/**
 * Sequelize-backed adapter implementation for oidc-provider.
 */
class SequelizeAdapter {
    readonly name: string;

    /**
     * Construct the adapter for a specific model name.
     *
     * @param name - Token or artifact model name.
     */
    constructor(name: string) {
        this.name = name;
    }

    /**
     * Ensure the Sequelize connection is established.
     */
    static async connect(): Promise<void> {
        await sequelize.authenticate();
    }

    /**
     * Access the backing Sequelize model.
     */
    private collection() {
        return models.oidc_adapter_store;
    }

    /**
     * Compute an absolute expiration date from a relative TTL in seconds.
     *
     * @param expiresIn - TTL in seconds.
     * @returns Expiration Date or null.
     */
    private computeExpires(expiresIn?: number): Date | null {
        if (!expiresIn) {
            return null;
        }
        return new Date(Date.now() + expiresIn * 1000);
    }

    /**
     * Insert or update a stored entry.
     *
     * @param id - Record identifier.
     * @param payload - Payload to persist.
     * @param expiresAt - Optional expiration time.
     */
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

    /**
     * Write a payload with an optional TTL.
     */
    async upsert(id: string, payload: Payload, expiresIn?: number): Promise<void> {
        const expiresAt = this.computeExpires(expiresIn);
        await this.upsertEntry(id, payload, expiresAt);
    }

    /**
     * Convert a Sequelize record into a token payload, enforcing invariants.
     *
     * @param entry - Sequelize model instance.
     * @returns Token payload or undefined when missing/expired.
     */
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

    /**
     * Locate a record by identifier.
     */
    async find(id: string): Promise<Payload | undefined> {
        const entry = await this.collection().findOne({ where: { id, name: this.name } });
        if (!entry && this.name === "Interaction") {
            console.warn("[adapter:Interaction] find miss", id);
        } else if (entry && this.name === "Interaction") {
            console.log("[adapter:Interaction] find hit", id);
        }
        return this.sanitize(entry);
    }

    /**
     * Locate a record by user code.
     */
    async findByUserCode(userCode: string): Promise<Payload | undefined> {
        const entry = await this.collection().findOne({ where: { userCode, name: this.name } });
        return this.sanitize(entry);
    }

    /**
     * Locate a record by UID.
     */
    async findByUid(uid: string): Promise<Payload | undefined> {
        const entry = await this.collection().findOne({ where: { uid, name: this.name } });
        return this.sanitize(entry);
    }

    /**
     * Remove a record by identifier.
     */
    async destroy(id: string): Promise<void> {
        await this.collection().destroy({ where: { id, name: this.name } });
    }

    /**
     * Revoke artifacts associated with a grant.
     */
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

    /**
     * Mark a record as consumed.
     */
    async consume(id: string): Promise<void> {
        await this.collection().update({ consumedAt: now() }, { where: { id, name: this.name } });
    }

    /**
     * Remove expired artifacts.
     */
    async cleanExpired(): Promise<void> {
        await this.collection().destroy({
            where: {
                expiresAt: {
                    [Op.lt]: now(),
                },
            },
        });
    }

    /**
     * Remove all artifacts for a grantId (used by token exchange logs).
     */
    async grantCleaner(grantId: string): Promise<void> {
        await this.collection().destroy({ where: { grantId } });
    }
}

export default SequelizeAdapter;
