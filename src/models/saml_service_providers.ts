// @ts-nocheck
import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface saml_service_providersAttributes {
  id: string;
  entityId: string;
  metadataXml?: string;
  acsEndpoints: object;
  binding: string;
  attributeMapping: object;
  createdAt: Date;
  updatedAt: Date;
}

export type saml_service_providersPk = "id";
export type saml_service_providersId = saml_service_providers[saml_service_providersPk];
export type saml_service_providersOptionalAttributes = "id" | "metadataXml" | "acsEndpoints" | "attributeMapping" | "createdAt" | "updatedAt";
export type saml_service_providersCreationAttributes = Optional<saml_service_providersAttributes, saml_service_providersOptionalAttributes>;

export class saml_service_providers extends Model<saml_service_providersAttributes, saml_service_providersCreationAttributes> implements saml_service_providersAttributes {
  id!: string;
  entityId!: string;
  metadataXml?: string;
  acsEndpoints!: object;
  binding!: string;
  attributeMapping!: object;
  createdAt!: Date;
  updatedAt!: Date;


  static initModel(sequelize: Sequelize.Sequelize): typeof saml_service_providers {
    return saml_service_providers.init({
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    entityId: {
      type: DataTypes.STRING(512),
      allowNull: false,
      unique: "saml_service_providers_entityId_key"
    },
    metadataXml: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    acsEndpoints: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    binding: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    attributeMapping: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  }, {
    sequelize,
    tableName: 'saml_service_providers',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "saml_service_providers_entityId_idx",
        unique: true,
        fields: [
          { name: "entityId" },
        ]
      },
      {
        name: "saml_service_providers_entityId_key",
        unique: true,
        fields: [
          { name: "entityId" },
        ]
      },
      {
        name: "saml_service_providers_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
