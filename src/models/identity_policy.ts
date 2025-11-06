// @ts-nocheck
import { DataTypes, type Model, type ModelAttributes, type Optional, type Sequelize } from "sequelize";

export interface IdentityPolicyAttributes {
    id: string;
    name: string;
    targetType: string;
    targetId?: string | null;
    policy: Record<string, unknown>;
    createdAt?: Date;
    updatedAt?: Date;
}

type CreationAttributes = Optional<IdentityPolicyAttributes, "id" | "targetId" | "createdAt" | "updatedAt">;

export type IdentityPolicyModel = Model<IdentityPolicyAttributes, CreationAttributes>;

const attributes: ModelAttributes<IdentityPolicyModel, IdentityPolicyAttributes> = {
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    targetType: {
        type: DataTypes.STRING(32),
        allowNull: false,
    },
    targetId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    policy: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
    },
};

const defineIdentityPolicy = (sequelize: Sequelize) => {
    return sequelize.define<IdentityPolicyModel>("identity_policies", attributes, {
        tableName: "identity_policies",
        schema: "public",
        timestamps: true,
        indexes: [
            {
                name: "identity_policies_target_idx",
                fields: ["targetType", "targetId"],
            },
        ],
    });
};

export default defineIdentityPolicy;
