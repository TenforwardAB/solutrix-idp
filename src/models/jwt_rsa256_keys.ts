// @ts-nocheck
import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface jwt_rsa256_keysAttributes {
  id: number;
  publicKey: string;
  privateKey: string;
  keyId: string;
  validUntil?: Date;
  isInvalid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type jwt_rsa256_keysPk = "id";
export type jwt_rsa256_keysId = jwt_rsa256_keys[jwt_rsa256_keysPk];
export type jwt_rsa256_keysOptionalAttributes = "id" | "validUntil" | "createdAt" | "updatedAt";
export type jwt_rsa256_keysCreationAttributes = Optional<jwt_rsa256_keysAttributes, jwt_rsa256_keysOptionalAttributes>;

export class jwt_rsa256_keys extends Model<jwt_rsa256_keysAttributes, jwt_rsa256_keysCreationAttributes> implements jwt_rsa256_keysAttributes {
  id!: number;
  publicKey!: string;
  privateKey!: string;
  keyId!: string;
  validUntil?: Date;
  isInvalid!: boolean;
  createdAt!: Date;
  updatedAt!: Date;


  static initModel(sequelize: Sequelize.Sequelize): typeof jwt_rsa256_keys {
    return jwt_rsa256_keys.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    publicKey: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    privateKey: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    keyId: {
      type: DataTypes.STRING(8),
      allowNull: false,
      unique: "jwt_rsa256_keys_keyId_key"
    },
    validUntil: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isInvalid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    tableName: 'jwt_rsa256_keys',
    schema: 'public',
    hasTrigger: true,
    timestamps: true,
    indexes: [
      {
        name: "jwt_rsa256_keys_keyId_key",
        unique: true,
        fields: [
          { name: "keyId" },
        ]
      },
      {
        name: "jwt_rsa256_keys_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
