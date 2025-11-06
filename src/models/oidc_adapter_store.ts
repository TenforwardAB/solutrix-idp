// @ts-nocheck
import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface oidc_adapter_storeAttributes {
  id: string;
  name: string;
  payload: object;
  grantId?: string;
  userCode?: string;
  uid?: string;
  expiresAt?: Date;
  consumedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type oidc_adapter_storePk = "id";
export type oidc_adapter_storeId = oidc_adapter_store[oidc_adapter_storePk];
export type oidc_adapter_storeOptionalAttributes = "grantId" | "userCode" | "uid" | "expiresAt" | "consumedAt" | "createdAt" | "updatedAt";
export type oidc_adapter_storeCreationAttributes = Optional<oidc_adapter_storeAttributes, oidc_adapter_storeOptionalAttributes>;

export class oidc_adapter_store extends Model<oidc_adapter_storeAttributes, oidc_adapter_storeCreationAttributes> implements oidc_adapter_storeAttributes {
  id!: string;
  name!: string;
  payload!: object;
  grantId?: string;
  userCode?: string;
  uid?: string;
  expiresAt?: Date;
  consumedAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;


  static initModel(sequelize: Sequelize.Sequelize): typeof oidc_adapter_store {
    return oidc_adapter_store.init({
    id: {
      type: DataTypes.STRING(128),
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    payload: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    grantId: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    userCode: {
      type: DataTypes.STRING(128),
      allowNull: true,
      unique: "oidc_adapter_store_userCode_key"
    },
    uid: {
      type: DataTypes.STRING(128),
      allowNull: true,
      unique: "oidc_adapter_store_uid_key"
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    consumedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'oidc_adapter_store',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "oidc_adapter_store_expiresAt_idx",
        fields: [
          { name: "expiresAt" },
        ]
      },
      {
        name: "oidc_adapter_store_grantId_idx",
        fields: [
          { name: "grantId" },
        ]
      },
      {
        name: "oidc_adapter_store_name_idx",
        fields: [
          { name: "name" },
        ]
      },
      {
        name: "oidc_adapter_store_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "oidc_adapter_store_uid_key",
        unique: true,
        fields: [
          { name: "uid" },
        ]
      },
      {
        name: "oidc_adapter_store_userCode_key",
        unique: true,
        fields: [
          { name: "userCode" },
        ]
      },
    ]
  });
  }
}
