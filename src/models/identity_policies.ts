// @ts-nocheck
import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface identity_policiesAttributes {
  id: string;
  name: string;
  targetType: string;
  targetId?: string;
  policy: object;
  createdAt: Date;
  updatedAt: Date;
}

export type identity_policiesPk = "id";
export type identity_policiesId = identity_policies[identity_policiesPk];
export type identity_policiesOptionalAttributes = "id" | "targetId" | "policy" | "createdAt" | "updatedAt";
export type identity_policiesCreationAttributes = Optional<identity_policiesAttributes, identity_policiesOptionalAttributes>;

export class identity_policies extends Model<identity_policiesAttributes, identity_policiesCreationAttributes> implements identity_policiesAttributes {
  id!: string;
  name!: string;
  targetType!: string;
  targetId?: string;
  policy!: object;
  createdAt!: Date;
  updatedAt!: Date;


  static initModel(sequelize: Sequelize.Sequelize): typeof identity_policies {
    return identity_policies.init({
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    targetType: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    targetId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    policy: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  }, {
    sequelize,
    tableName: 'identity_policies',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "identity_policies_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "identity_policies_target_idx",
        fields: [
          { name: "targetType" },
          { name: "targetId" },
        ]
      },
    ]
  });
  }
}
