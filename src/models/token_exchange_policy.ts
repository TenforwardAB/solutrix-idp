// @ts-nocheck
import { DataTypes, type Model, type ModelAttributes, type Optional, type Sequelize } from "sequelize";

export interface TokenExchangePolicyAttributes {
    id: string;
    clientId: string;
    priority: number;
    subject: string | null;
    subjectTokenTypes: string[];
    audiences: string[];
    scopes: string[] | null;
    actorTokenRequired: boolean;
    enabled: boolean;
    description: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

type CreationAttributes = Optional<
    TokenExchangePolicyAttributes,
    "id" | "priority" | "subject" | "subjectTokenTypes" | "audiences" | "scopes" | "actorTokenRequired" | "enabled" | "description" | "createdAt" | "updatedAt"
>;

export type TokenExchangePolicyModel = Model<TokenExchangePolicyAttributes, CreationAttributes>;

const attributes: ModelAttributes<TokenExchangePolicyModel, TokenExchangePolicyAttributes> = {
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
    priority: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    subject: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    subjectTokenTypes: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
    audiences: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
    scopes: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    actorTokenRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
};

const defineTokenExchangePolicy = (sequelize: Sequelize) => {
    return sequelize.define<TokenExchangePolicyModel>("token_exchange_policies", attributes, {
        tableName: "token_exchange_policies",
        schema: "public",
        timestamps: true,
        indexes: [
            {
                name: "token_exchange_policies_client_priority_idx",
                fields: ["clientId", "priority"],
            },
            {
                name: "token_exchange_policies_client_subject_idx",
                fields: ["clientId", "subject"],
            },
        ],
    });
};

export default defineTokenExchangePolicy;
