import { DataTypes, Model, ModelAttributes, ModelStatic, Sequelize } from "sequelize";

interface JwtKeyAttributes {
    id?: number;
    publicKey: string;
    privateKey: string;
    keyId: string;
    validUntil?: Date | null;
    isInvalid?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

type JwtKeyModel = Model<JwtKeyAttributes>;

const attributes: ModelAttributes<JwtKeyModel, JwtKeyAttributes> = {
    id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
    },
    publicKey: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    privateKey: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    keyId: {
        type: DataTypes.STRING(8),
        allowNull: false,
        unique: "jwt_rsa256_keys_keyId_key",
    },
    validUntil: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    isInvalid: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
};

const defineJwtKeys = (sequelize: Sequelize): ModelStatic<JwtKeyModel> => {
    return sequelize.define<JwtKeyModel>("jwt_rsa256_keys", attributes, {
        tableName: "jwt_rsa256_keys",
        schema: "public",
        timestamps: true,
        indexes: [
            {
                name: "jwt_rsa256_keys_keyId_key",
                unique: true,
                fields: ["keyId"],
            },
            {
                name: "jwt_rsa256_keys_pkey",
                unique: true,
                fields: ["id"],
            },
        ],
    });
};

export default defineJwtKeys;
