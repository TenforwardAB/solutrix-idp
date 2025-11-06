// @ts-nocheck
import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface oidc_clientsAttributes {
  id: string;
  clientId: string;
  clientSecret: string;
  name: string;
  redirectUris: object;
  grantTypes: object;
  scopes: object;
  createdAt: Date;
  updatedAt: Date;
}

export type oidc_clientsPk = "id";
export type oidc_clientsId = oidc_clients[oidc_clientsPk];
export type oidc_clientsOptionalAttributes = "id" | "createdAt" | "updatedAt";
export type oidc_clientsCreationAttributes = Optional<oidc_clientsAttributes, oidc_clientsOptionalAttributes>;

export class oidc_clients extends Model<oidc_clientsAttributes, oidc_clientsCreationAttributes> implements oidc_clientsAttributes {
  id!: string;
  clientId!: string;
  clientSecret!: string;
  name!: string;
  redirectUris!: object;
  grantTypes!: object;
  scopes!: object;
  createdAt!: Date;
  updatedAt!: Date;


  static initModel(sequelize: Sequelize.Sequelize): typeof oidc_clients {
    return oidc_clients.init({
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    clientId: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: "oidc_clients_clientId_key"
    },
    clientSecret: {
      type: DataTypes.STRING(256),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    redirectUris: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    grantTypes: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    scopes: {
      type: DataTypes.JSONB,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'oidc_clients',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "oidc_clients_clientId_idx",
        unique: true,
        fields: [
          { name: "clientId" },
        ]
      },
      {
        name: "oidc_clients_clientId_key",
        unique: true,
        fields: [
          { name: "clientId" },
        ]
      },
      {
        name: "oidc_clients_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
