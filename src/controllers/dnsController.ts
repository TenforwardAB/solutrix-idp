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
 * Created on 12/18/24 :: 9:21PM BY joyider <andre(-at-)sess.se>
 *
 * This file :: dnsController.ts is part of the solutrix-api project.
 */

import { Request, Response } from 'express';
import * as dnsService from '../services/dnsService';
import { createDnsRecord } from "../services/dnsService";

export const addDomain = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { customerid, domain_name } = req.body;

        if (!customerid || !domain_name) {
            return res.status(400).json({ message: 'Customer ID and domain name are required' });
        }

        const result = await dnsService.createDomainAndZone(customerid, domain_name);

        return res.status(201).json(result);
    } catch (error) {
        console.error('Error adding domain:', error);
        return res.status(500).json({ message: 'Failed to add domain' });
    }
};

export const getDomainRecords = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { domain_name } = req.params;

        if (!domain_name) {
            return res.status(400).json({ message: 'Domain name is required' });
        }

        const records = await dnsService.getDomainRecords(domain_name);

        return res.status(200).json(records);
    } catch (error) {
        console.error('Error fetching domain records:', error);
        return res.status(500).json({ message: 'Failed to fetch domain records' });
    }
};

export const getCustomerDomains = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { customerid } = req.params;

        if (!customerid) {
            return res.status(400).json({ message: 'Customer ID is required' });
        }

        const domains = await dnsService.getDomainsForCustomer(customerid);

        return res.status(200).json(domains);
    } catch (error) {
        console.error('Error fetching customer domains:', error);
        return res.status(500).json({ message: 'Failed to fetch customer domains' });
    }
};


export const createRecord = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { record } = req.body;
        const { domain_name } = req.params;

        if (!domain_name || !record) {
            return res.status(400).json({ message: "Missing required fields: zone and record." });
        }

        await createDnsRecord(domain_name, record);

        return res.status(200).json({ message: `Record successfully created/updated for zone: ${domain_name}` });
    } catch (error) {
        console.error("Error creating/updating DNS record:", error);
        return res.status(500).json({ message: "Internal server error", error: error });
    }
};
