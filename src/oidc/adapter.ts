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

        if (entry.expiresAt && entry.expiresAt < now()) {
            void entry.destroy();
            return undefined;
        }

        const payload: Payload = typeof entry.payload === "string" ? JSON.parse(entry.payload) : entry.payload;
        if (entry.consumedAt) {
            payload.consumed = entry.consumedAt.getTime() / 1000;
        }
        return payload;
    }

    async find(id: string): Promise<Payload | undefined> {
        const entry = await this.collection().findOne({ where: { id, name: this.name } });
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
