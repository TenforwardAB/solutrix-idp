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
 * Created on 4/7/25 :: 8:06PM BY joyider <andre(-at-)sess.se>
 *
 * This file :: filterRoutes.ts is part of the solutrix-api project.
 */

import { Router } from "express";
import { FilterController } from "../../controllers/mail/filterController";
import { authMiddleware } from "../../middleware/authMiddleware";

const filterRouter = Router();
const filterController = new FilterController();

/**
 * Route: GET /filters
 * Description: Fetch all filters for all user.
 * Query Parameters (optional):
 * - metaData: boolean
 * - sess: string
 * - ip: string
 */
filterRouter.get("/", authMiddleware, filterController.listAllFilters);

/**
 * Route: GET /filters/user
 * Description: Fetch all filters for the authenticated user.
 * Query Parameters (optional):
 * - metaData: boolean
 * - sess: string
 * - ip: string
 */
filterRouter.get("/user/", authMiddleware, filterController.listUserFilters);

/**
 * Route: POST /filters
 * Description: Create a new filter for the authenticated user.
 * Request Body:
 * - name: string
 * - query: { from?, to?, subject?, listId?, text?, ha?, size? }
 * - action: { seen?, flag?, delete?, spam?, mailbox?, targets? }
 * - disabled?: boolean
 * - metaData?: any
 * - sess?: string
 * - ip?: string
 */
filterRouter.post("/", authMiddleware, filterController.createFilter);

/**
 * Route: GET /filters/:filterId
 * Description: Retrieve detailed information for a specific filter.
 * Query Parameters (optional):
 * - sess: string
 * - ip: string
 */
filterRouter.get("/:filterId", authMiddleware, filterController.getFilterInformation);

/**
 * Route: PUT /filters/:filterId
 * Description: Update an existing filter for the authenticated user.
 * Request Body:
 * - name: string
 * - query: { from?, to?, subject?, listId?, text?, ha?, size? }
 * - action: { seen?, flag?, delete?, spam?, mailbox?, targets? }
 * - disabled: boolean
 * - metaData?: any
 * - sess?: string
 * - ip?: string
 */
filterRouter.put("/:filterId", authMiddleware, filterController.updateFilter);

/**
 * Route: DELETE /filters/:filterId
 * Description: Delete a specific filter for the authenticated user.
 * Query Parameters (optional):
 * - sess: string
 * - ip: string
 */
filterRouter.delete("/:filterId", authMiddleware, filterController.deleteFilter);

export default filterRouter;
