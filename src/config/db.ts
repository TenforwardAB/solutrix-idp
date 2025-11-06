import { Sequelize, QueryTypes } from "sequelize";
import dotenv from "dotenv";
import { WildduckNodeSDK } from "wildduck-nodesdk";
import * as process from "node:process";

import { initModels } from "../models/init-models.js";

dotenv.config();

export const wds = new WildduckNodeSDK(process.env.WD_API_KEY as string, process.env.WD_API_URL as string);

export const sequelize = new Sequelize(process.env.DATABASE_URL as string, {
    dialect: "postgres",
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
    ssl: false,
    define: {
        timestamps: true,
    },
});
const models = initModels(sequelize) as Record<string, any>;
/**
 * Verify the Sequelize connection by running authenticate.
 */
export const testDatabaseConnection = async (): Promise<void> => {
    try {
        await sequelize.authenticate();
        console.log("Connection to the database has been established successfully.");
    } catch (error) {
        console.error("Unable to connect to the database:", error);
    }
};

/**
 * Execute a raw SQL query through Sequelize.
 *
 * @param queryText - SQL statement.
 * @param params - Positional replacements.
 * @param queryType - Optional query type.
 */
export const query = async (queryText: string, params?: any[], queryType?: QueryTypes) => {
    try {
        // Run any SQL query
        const result = await sequelize.query(queryText, {
            replacements: params,
            type: queryType || QueryTypes.RAW,
        });
        return result;
    } catch (error) {
        console.error("Error executing query:", error);
        throw error;
    }
};

export default models;
