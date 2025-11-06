// @ts-nocheck
import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface token_exchange_eventsAttributes {
  id: string;
  clientId: string;
  policyId?: string;
  subject?: string;
  subjectTokenType: string;
  subjectTokenId?: string;
  requestedAudience?: string;
  grantedAudience?: string;
  requestedScopes?: object;
  grantedScopes?: object;
  actorSubject?: string;
  success: boolean;
  error?: string;
  issuedTokenId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type token_exchange_eventsPk = "id";
export type token_exchange_eventsId = token_exchange_events[token_exchange_eventsPk];
export type token_exchange_eventsOptionalAttributes = "id" | "policyId" | "subject" | "subjectTokenId" | "requestedAudience" | "grantedAudience" | "requestedScopes" | "grantedScopes" | "actorSubject" | "error" | "issuedTokenId" | "createdAt" | "updatedAt";
export type token_exchange_eventsCreationAttributes = Optional<token_exchange_eventsAttributes, token_exchange_eventsOptionalAttributes>;

export class token_exchange_events extends Model<token_exchange_eventsAttributes, token_exchange_eventsCreationAttributes> implements token_exchange_eventsAttributes {
  id!: string;
  clientId!: string;
  policyId?: string;
  subject?: string;
  subjectTokenType!: string;
  subjectTokenId?: string;
  requestedAudience?: string;
  grantedAudience?: string;
  requestedScopes?: object;
  grantedScopes?: object;
  actorSubject?: string;
  success!: boolean;
  error?: string;
  issuedTokenId?: string;
  createdAt!: Date;
  updatedAt!: Date;


  static initModel(sequelize: Sequelize.Sequelize): typeof token_exchange_events {
    return token_exchange_events.init({
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
    policyId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    subjectTokenType: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    subjectTokenId: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    requestedAudience: {
      type: DataTypes.STRING(512),
      allowNull: true
    },
    grantedAudience: {
      type: DataTypes.STRING(512),
      allowNull: true
    },
    requestedScopes: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    grantedScopes: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    actorSubject: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    success: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    issuedTokenId: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'token_exchange_events',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "token_exchange_events_client_created_idx",
        fields: [
          { name: "clientId" },
          { name: "createdAt" },
        ]
      },
      {
        name: "token_exchange_events_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
