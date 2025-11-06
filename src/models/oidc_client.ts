// @ts-nocheck
import { DataTypes, type Model, type ModelAttributes, type Optional, type Sequelize } from "sequelize";

export interface OidcClientAttributes {
    id: string;
    clientId: string;
    clientSecret: string;
    name: string;
    redirectUris: string[];
    grantTypes: string[];
    scopes: string[];
    createdAt?: Date;
    updatedAt?: Date;
}

type CreationAttributes = Optional<OidcClientAttributes, "id" | "createdAt" | "updatedAt">;

export type OidcClientModel = Model<OidcClientAttributes, CreationAttributes>;

const attributes: ModelAttributes<OidcClientModel, OidcClientAttributes> = {
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    clientId: {
        type: DataTypes.STRING(128),
        allowNull: false,
        unique: true,
    },
    clientSecret: {
        type: DataTypes.STRING(256),
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    redirectUris: {
        type: DataTypes.JSONB,
        allowNull: false,
    },
    grantTypes: {
        type: DataTypes.JSONB,
        allowNull: false,
    },
    scopes: {
        type: DataTypes.JSONB,
        allowNull: false,
    },
};

const defineOidcClient = (sequelize: Sequelize) => {
    return sequelize.define<OidcClientModel>("oidc_clients", attributes, {
        tableName: "oidc_clients",
        schema: "public",
        timestamps: true,
        indexes: [
            {
                name: "oidc_clients_clientId_idx",
                unique: true,
                fields: ["clientId"],
            },
        ],
    });
};

export default defineOidcClient;
