// @ts-nocheck
import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface admin_audit_eventsAttributes {
  id: string;
  actorSubject?: string;
  actorEmail?: string;
  customerId?: string;
  action: string;
  targetType: string;
  targetId?: string;
  authType: string;
  ip?: string;
  userAgent?: string;
  metadata: object;
  createdAt: Date;
  updatedAt: Date;
}

export type admin_audit_eventsPk = "id";
export type admin_audit_eventsId = admin_audit_events[admin_audit_eventsPk];
export type admin_audit_eventsOptionalAttributes = "id" | "actorSubject" | "actorEmail" | "customerId" | "targetId" | "ip" | "userAgent" | "metadata" | "createdAt" | "updatedAt";
export type admin_audit_eventsCreationAttributes = Optional<admin_audit_eventsAttributes, admin_audit_eventsOptionalAttributes>;

export class admin_audit_events extends Model<admin_audit_eventsAttributes, admin_audit_eventsCreationAttributes> implements admin_audit_eventsAttributes {
  id!: string;
  actorSubject?: string;
  actorEmail?: string;
  customerId?: string;
  action!: string;
  targetType!: string;
  targetId?: string;
  authType!: string;
  ip?: string;
  userAgent?: string;
  metadata!: object;
  createdAt!: Date;
  updatedAt!: Date;


  static initModel(sequelize: Sequelize.Sequelize): typeof admin_audit_events {
    return admin_audit_events.init({
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    actorSubject: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    actorEmail: {
      type: DataTypes.STRING(320),
      allowNull: true
    },
    customerId: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    action: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    targetType: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    targetId: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    authType: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    ip: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  }, {
    sequelize,
    tableName: 'admin_audit_events',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "admin_audit_events_actorSubject_createdAt_idx",
        fields: [
          { name: "actorSubject" },
          { name: "createdAt" },
        ]
      },
      {
        name: "admin_audit_events_customerId_createdAt_idx",
        fields: [
          { name: "customerId" },
          { name: "createdAt" },
        ]
      },
      {
        name: "admin_audit_events_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
