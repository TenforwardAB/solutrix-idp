/**
 * This file is licensed under the European Union Public License (EUPL) v1.2.
 * You may only use this work in compliance with the License.
 * You may obtain a copy of the License at:
 *
 * https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed "as is",
 * without any warranty or conditions of any kind.
 *
 * Copyright (c) 2024- Tenforward AB. All rights reserved.
 *
 * Created on 4/7/25 :: 7:49PM BY joyider <andre(-at-)sess.se>
 *
 * This file :: filterService.ts is part of the solutrix-api project.
 */

import { wds } from "../../config/db";

export interface FilterData {
    name: string;
    query: {
        from?: string;
        to?: string;
        subject?: string;
        listId?: string;
        text?: string;
        ha?: boolean;
        size?: number;
    };
    action: {
        seen?: boolean;
        flag?: boolean;
        delete?: boolean;
        spam?: boolean;
        mailbox?: string;
        targets?: string[];
    };
    disabled?: boolean;
    metaData?: any;
    sess?: string;
    ip?: string;
}

export class FilterService {
    /**
     * Retrieves all filters.
     *
     * @param {object} [params] - Optional query parameters for filtering.
     * @returns {Promise<Array<object>>} An array of filters.
     * @throws {Error} If the API request fails.
     */
    async listAllFilters(params?: object) {
        try {
            const response = await wds.filters.listAllFilters(params);
            if (response.success) {
                return response;
            } else {
                throw new Error("Failed to fetch all filters.");
            }
        } catch (error) {
            throw new Error(`Error fetching all filters: ${error}`);
        }
    }

    /**
     * Retrieves filters for a specific user.
     *
     * @param {string} user - The user's ID.
     * @param {object} [params] - Optional query parameters for filtering.
     * @returns {Promise<{ limits: object; results: Array<object> }>} An object containing filter usage limits and filters.
     * @throws {Error} If the API request fails.
     */
    async listUserFilters(user: string, params?: object) {
        try {
            const response = await wds.filters.listUserFilters(user, params);
            if (response.success) {
                return { success: true, limits: response.limits, results: response.results };
            } else {
                throw new Error("Failed to fetch user filters.");
            }
        } catch (error) {
            throw new Error(`Error fetching user filters: ${error}`);
        }
    }

    /**
     * Creates a new filter for a specific user.
     *
     * @param {string} user - The user's ID.
     * @param {FilterData} filterData - The filter data.
     * @returns {Promise<object>} The newly created filter details.
     * @throws {Error} If the API request fails.
     */
    async createFilter(user: string, filterData: FilterData) {
        try {
            const response = await wds.filters.createFilter(user, filterData);
            if (response.success) {
                return response.filter;
            } else {
                throw new Error("Failed to create filter.");
            }
        } catch (error) {
            throw new Error(`Error creating filter: ${error}`);
        }
    }

    /**
     * Retrieves detailed information for a specific filter.
     *
     * @param {string} user - The user's ID.
     * @param {string} filter - The filter's unique ID.
     * @param {object} [params] - Optional query parameters for logging.
     * @returns {Promise<object>} The filter information.
     * @throws {Error} If the API request fails.
     */
    async getFilterInformation(user: string, filter: string, params?: object) {
        try {
            const response = await wds.filters.getFilterInformation(user, filter, params);
            if (response.success) {
                return response;
            } else {
                throw new Error("Failed to fetch filter information.");
            }
        } catch (error) {
            throw new Error(`Error fetching filter information: ${error}`);
        }
    }

    /**
     * Deletes a specific filter for a user.
     *
     * @param {string} user - The user's ID.
     * @param {string} filter - The filter's unique ID.
     * @param {object} [params] - Optional query parameters for logging.
     * @returns {Promise<object>} The response object.
     * @throws {Error} If the API request fails.
     */
    async deleteFilter(user: string, filter: string, params?: object) {
        try {
            const response = await wds.filters.deleteFilter(user, filter, params);
            if (response.success) {
                return response;
            } else {
                throw new Error("Failed to delete filter.");
            }
        } catch (error) {
            throw new Error(`Error deleting filter: ${error}`);
        }
    }

    /**
     * Updates an existing filter for a user.
     *
     * @param {string} user - The user's ID.
     * @param {string} filter - The filter's unique ID.
     * @param {FilterData} filterData - The updated filter data.
     * @returns {Promise<object>} The response object.
     * @throws {Error} If the API request fails.
     */
    async updateFilter(user: string, filter: string, filterData: FilterData) {
        try {
            // @ts-ignore TODO: FIX interface type to correct
            const response = await wds.filters.updateFilter(user, filter, filterData);
            if (response.success) {
                return response;
            } else {
                throw new Error("Failed to update filter.");
            }
        } catch (error) {
            throw new Error(`Error updating filter: ${error}`);
        }
    }
}
