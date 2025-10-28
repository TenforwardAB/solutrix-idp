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
 * Created on 4/7/25 :: 8:02PM BY joyider <andre(-at-)sess.se>
 *
 * This file :: filterController.ts is part of the solutrix-api project.
 */

import { Request, Response } from "express";
import { logger } from "../../services/loggerService";
import { FilterService } from "../../services/mail/filterService";

const filterService = new FilterService();

export class FilterController {

    /**
     * Retrieves all filters from the system.
     *
     * This method is intended for administrative or system-wide usage where the filters
     * for all users are needed. It extracts query parameters from the request, calls the service,
     * and returns the list of filters.
     *
     * @param {Request} req - The Express request object.
     * @param {Response} res - The Express response object.
     * @returns {void} A JSON response with the list of filters or an error message.
     *
     */
    async listAllFilters(req: Request, res: Response) {
        const params = req.query;

        try {
            const filters = await filterService.listAllFilters(params);
            if (filters.success)
                res.status(200).json({ success: true, filters });
            else res.status(404).json({ success: false });
        } catch (error) {
            // @ts-ignore
            logger.info("Error fetching all filters:", error.message);
            res.status(500).json({ success: false, message: error });
        }
    }
    /**
     * Retrieves filters for a specific user.
     */
    async listUserFilters(req: Request, res: Response) {
        // @ts-ignore
        const userId = req["X-API-UserID"];
        const params = req.query;

        try {
            const filters = await filterService.listUserFilters(userId, params);
            res.status(200).json({ success: true, filters });
        } catch (error) {
            // @ts-ignore
            logger.info("Error fetching user filters:", error.message);
            res.status(500).json({ success: false, message: error });
        }
    }

    /**
     * Creates a new filter for a user.
     */
    async createFilter(req: Request, res: Response) {
        // @ts-ignore
        const userId = req["X-API-UserID"];
        const filterData = req.body;

        try {
            const newFilter = await filterService.createFilter(userId, filterData);
            res.status(201).json({ success: true, filter: newFilter });
        } catch (error) {
            // @ts-ignore
            logger.info("Error creating filter:", error.message);
            res.status(500).json({ success: false, message: error });
        }
    }

    /**
     * Retrieves detailed information for a specific filter.
     * Expects the filter ID in req.params.filterId.
     */
    async getFilterInformation(req: Request, res: Response) {
        // @ts-ignore
        const userId = req["X-API-UserID"];
        const filterId = req.params.filterId;
        const params = req.query;

        try {
            const filterInfo = await filterService.getFilterInformation(userId, filterId, params);
            res.status(200).json({ success: true, filter: filterInfo });
        } catch (error) {
            // @ts-ignore
            logger.info("Error fetching filter information:", error.message);
            res.status(500).json({ success: false, message: error });
        }
    }

    /**
     * Updates an existing filter.
     * Expects the filter ID in req.params.filterId and updated data in req.body.
     */
    async updateFilter(req: Request, res: Response) {
        // @ts-ignore
        const userId = req["X-API-UserID"];
        const filterId = req.params.filterId;
        const filterData = req.body;

        try {
            const updated = await filterService.updateFilter(userId, filterId, filterData);
            res.status(200).json({ success: true, response: updated });
        } catch (error) {
            // @ts-ignore
            logger.info("Error updating filter:", error.message);
            res.status(500).json({ success: false, message: error });
        }
    }

    /**
     * Deletes a specific filter.
     * Expects the filter ID in req.params.filterId.
     */
    async deleteFilter(req: Request, res: Response) {
        // @ts-ignore
        const userId = req["X-API-UserID"];
        const filterId = req.params.filterId;
        const params = req.query;

        try {
            const response = await filterService.deleteFilter(userId, filterId, params);
            res.status(200).json({ success: true, response });
        } catch (error) {
            // @ts-ignore
            logger.info("Error deleting filter:", error.message);
            res.status(500).json({ success: false, message: error });
        }
    }
}
