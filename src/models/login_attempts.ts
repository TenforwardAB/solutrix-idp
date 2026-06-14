// @ts-nocheck
import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface login_attemptsAttributes {
  id: string;
  attemptKey: string;
  keyType: string;
  failureCount: number;
  lockedUntil?: Date;
  firstFailureAt: Date;
  lastFailureAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type login_attemptsPk = "id";
export type login_attemptsId = login_attempts[login_attemptsPk];
export type login_attemptsOptionalAttributes = "id" | "failureCount" | "lockedUntil" | "firstFailureAt" | "lastFailureAt" | "createdAt" | "updatedAt";
export type login_attemptsCreationAttributes = Optional<login_attemptsAttributes, login_attemptsOptionalAttributes>;

export class login_attempts extends Model<login_attemptsAttributes, login_attemptsCreationAttributes> implements login_attemptsAttributes {
  id!: string;
  attemptKey!: string;
  keyType!: string;
  failureCount!: number;
  lockedUntil?: Date;
  firstFailureAt!: Date;
  lastFailureAt!: Date;
  createdAt!: Date;
  updatedAt!: Date;


  static initModel(sequelize: Sequelize.Sequelize): typeof login_attempts {
    return login_attempts.init({
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    attemptKey: {
      type: DataTypes.STRING(512),
      allowNull: false,
      unique: "login_attempts_attemptKey_key"
    },
    keyType: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    failureCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    lockedUntil: {
      type: DataTypes.DATE,
      allowNull: true
    },
    firstFailureAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    lastFailureAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now')
    }
  }, {
    sequelize,
    tableName: 'login_attempts',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "login_attempts_attemptKey_key",
        unique: true,
        fields: [
          { name: "attemptKey" },
        ]
      },
      {
        name: "login_attempts_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "login_attempts_type_locked_idx",
        fields: [
          { name: "keyType" },
          { name: "lockedUntil" },
        ]
      },
    ]
  });
  }
}
