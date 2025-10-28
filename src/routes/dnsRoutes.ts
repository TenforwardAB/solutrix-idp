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
 * Created on 12/18/24 :: 9:22PM BY joyider <andre(-at-)sess.se>
 *
 * This file :: dnsRoutes.ts is part of the solutrix-api project.
 */

import express from 'express';
import { authMiddleware } from "../middleware/authMiddleware";
import * as dnsController from '../controllers/dnsController';

const router = express.Router();

router.post('/domains', authMiddleware, dnsController.addDomain);
router.get('/customers/:customerid/domains', authMiddleware, dnsController.getCustomerDomains);
router.get('/domains/:domain_name/records', authMiddleware, dnsController.getDomainRecords);
router.post("/domains/:domain_name/create", authMiddleware, dnsController.createRecord);

export default router;
