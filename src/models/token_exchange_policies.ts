// @ts-nocheck
import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface token_exchange_policiesAttributes {
  id: string;
  clientId: string;
  priority: number;
  subject?: string;
  subjectTokenTypes: object;
  audiences: object;
  scopes?: object;
  actorTokenRequired: boolean;
  enabled: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type token_exchange_policiesPk = "id";
export type token_exchange_policiesId = token_exchange_policies[token_exchange_policiesPk];
export type token_exchange_policiesOptionalAttributes = "id" | "priority" | "subject" | "subjectTokenTypes" | "audiences" | "scopes" | "enabled" | "description" | "createdAt" | "updatedAt";
export type token_exchange_policiesCreationAttributes = Optional<token_exchange_policiesAttributes, token_exchange_policiesOptionalAttributes>;

export class token_exchange_policies extends Model<token_exchange_policiesAttributes, token_exchange_policiesCreationAttributes> implements token_exchange_policiesAttributes {
  id!: string;
  clientId!: string;
  priority!: number;
  subject?: string;
  subjectTokenTypes!: object;
  audiences!: object;
  scopes?: object;
  actorTokenRequired!: boolean;
  enabled!: boolean;
  description?: string;
  createdAt!: Date;
  updatedAt!: Date;


  static initModel(sequelize: Sequelize.Sequelize): typeof token_exchange_policies {
    return token_exchange_policies.init({
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    clientId: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    subjectTokenTypes: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    audiences: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    scopes: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    actorTokenRequired: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'token_exchange_policies',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "token_exchange_policies_client_priority_idx",
        fields: [
          { name: "clientId" },
          { name: "priority" },
        ]
      },
      {
        name: "token_exchange_policies_client_subject_idx",
        fields: [
          { name: "clientId" },
          { name: "subject" },
        ]
      },
      {
        name: "token_exchange_policies_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
