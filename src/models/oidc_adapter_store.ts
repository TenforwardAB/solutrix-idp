import {
    DataTypes,
    type Model,
    type ModelAttributes,
    type ModelStatic,
    type Optional,
    type Sequelize,
} from "sequelize";

interface OidcAdapterAttributes {
    id: string;
    name: string;
    payload: Record<string, unknown>;
    grantId?: string | null;
    userCode?: string | null;
    uid?: string | null;
    expiresAt?: Date | null;
    consumedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}

type CreationAttributes = Optional<
    OidcAdapterAttributes,
    "grantId" | "userCode" | "uid" | "expiresAt" | "consumedAt" | "createdAt" | "updatedAt"
>;

type OidcAdapterModel = Model<OidcAdapterAttributes, CreationAttributes>;

const attributes: ModelAttributes<OidcAdapterModel, OidcAdapterAttributes> = {
    id: {
        type: DataTypes.STRING(128),
        primaryKey: true,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING(64),
        allowNull: false,
    },
    payload: {
        type: DataTypes.JSONB,
        allowNull: false,
    },
    grantId: {
        type: DataTypes.STRING(128),
        allowNull: true,
    },
    userCode: {
        type: DataTypes.STRING(128),
        allowNull: true,
        unique: true,
    },
    uid: {
        type: DataTypes.STRING(128),
        allowNull: true,
        unique: true,
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    consumedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
};

const defineOidcAdapterStore = (sequelize: Sequelize): ModelStatic<OidcAdapterModel> => {
    return sequelize.define<OidcAdapterModel>("oidc_adapter_store", attributes, {
        tableName: "oidc_adapter_store",
        schema: "public",
        timestamps: true,
        indexes: [
            {
                name: "oidc_adapter_store_name_idx",
                fields: ["name"],
            },
            {
                name: "oidc_adapter_store_grantId_idx",
                fields: ["grantId"],
            },
            {
                name: "oidc_adapter_store_userCode_idx",
                unique: true,
                fields: ["userCode"],
            },
            {
                name: "oidc_adapter_store_uid_idx",
                unique: true,
                fields: ["uid"],
            },
            {
                name: "oidc_adapter_store_expiresAt_idx",
                fields: ["expiresAt"],
            },
        ],
    });
};

export type { OidcAdapterModel };
export default defineOidcAdapterStore;
