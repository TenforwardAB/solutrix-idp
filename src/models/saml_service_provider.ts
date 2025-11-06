import { DataTypes, type Model, type ModelAttributes, type Optional, type Sequelize } from "sequelize";

export interface SamlServiceProviderAttributes {
    id: string;
    entityId: string;
    metadataXml?: string | null;
    acsEndpoints: string[];
    binding: string;
    attributeMapping: Record<string, unknown>;
    createdAt?: Date;
    updatedAt?: Date;
}

type CreationAttributes = Optional<SamlServiceProviderAttributes, "id" | "metadataXml" | "createdAt" | "updatedAt">;

export type SamlServiceProviderModel = Model<SamlServiceProviderAttributes, CreationAttributes>;

const attributes: ModelAttributes<SamlServiceProviderModel, SamlServiceProviderAttributes> = {
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    entityId: {
        type: DataTypes.STRING(512),
        allowNull: false,
        unique: true,
    },
    metadataXml: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    acsEndpoints: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
    binding: {
        type: DataTypes.STRING(64),
        allowNull: false,
    },
    attributeMapping: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
    },
};

const defineSamlServiceProvider = (sequelize: Sequelize) => {
    return sequelize.define<SamlServiceProviderModel>("saml_service_providers", attributes, {
        tableName: "saml_service_providers",
        schema: "public",
        timestamps: true,
        indexes: [
            {
                name: "saml_service_providers_entityId_idx",
                unique: true,
                fields: ["entityId"],
            },
        ],
    });
};

export default defineSamlServiceProvider;
