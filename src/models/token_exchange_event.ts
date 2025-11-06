// @ts-nocheck
import { DataTypes, type Model, type ModelAttributes, type Optional, type Sequelize } from "sequelize";

export interface TokenExchangeEventAttributes {
    id: string;
    clientId: string;
    policyId: string | null;
    subject: string | null;
    subjectTokenType: string;
    subjectTokenId: string | null;
    requestedAudience: string | null;
    grantedAudience: string | null;
    requestedScopes: string[] | null;
    grantedScopes: string[] | null;
    actorSubject: string | null;
    success: boolean;
    error: string | null;
    issuedTokenId: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

type CreationAttributes = Optional<
    TokenExchangeEventAttributes,
    "id" | "policyId" | "subject" | "subjectTokenId" | "requestedAudience" | "grantedAudience" | "requestedScopes" | "grantedScopes" | "actorSubject" | "success" | "error" | "issuedTokenId" | "createdAt" | "updatedAt"
>;

export type TokenExchangeEventModel = Model<TokenExchangeEventAttributes, CreationAttributes>;

const attributes: ModelAttributes<TokenExchangeEventModel, TokenExchangeEventAttributes> = {
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    clientId: {
        type: DataTypes.STRING(128),
        allowNull: false,
    },
    policyId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    subject: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    subjectTokenType: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    subjectTokenId: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    requestedAudience: {
        type: DataTypes.STRING(512),
        allowNull: true,
    },
    grantedAudience: {
        type: DataTypes.STRING(512),
        allowNull: true,
    },
    requestedScopes: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    grantedScopes: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    actorSubject: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    success: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    error: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    issuedTokenId: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
};

const defineTokenExchangeEvent = (sequelize: Sequelize) => {
    return sequelize.define<TokenExchangeEventModel>("token_exchange_events", attributes, {
        tableName: "token_exchange_events",
        schema: "public",
        timestamps: true,
        indexes: [
            {
                name: "token_exchange_events_client_created_idx",
                fields: ["clientId", "createdAt"],
            },
        ],
    });
};

export default defineTokenExchangeEvent;
