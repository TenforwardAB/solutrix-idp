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
 * Created on 12/18/24 :: 9:18PM BY joyider <andre(-at-)sess.se>
 *
 * This file :: dnsService.ts is part of the solutrix-api project.
 */

import models from '../config/db';
import { pdns } from '../config/db';

const DEFAULT_NAMESERVERS = ['a-ns01.soluitrx.io.', 'b-ns01.soluitrx.io.'];

export const createDomainAndZone = async (customerId: string, domainName: string, kind: string = 'Master') => {
    try {
        const zoneData = {
            name: `${domainName}.`,
            kind,
            nameservers: DEFAULT_NAMESERVERS,
        };

        const zone = await pdns.zones.createZone('localhost', zoneData);

        // Save the domain to the core database
        const domain = await models.domains.create({
            customerid: customerId,
            domain_name: domainName,
            registrar: null,
            attributes: { kind, zoneId: zone.id },
        });

        return { domain, zone };
    } catch (error) {
        console.error('Error creating domain and zone:', error);
        throw new Error('Failed to create domain and zone');
    }
};

export const getDomainRecords = async (domainName: string) => {
    try {
        const zone = await pdns.zones.getZone('localhost', `${domainName}.`);

        return zone;
    } catch (error) {
        console.error('Error fetching domain records:', error);
        throw new Error('Failed to fetch domain records');
    }
};

export const getDomainsForCustomer = async (customerId: string) => {
    try {
        const domains = await models.domains.findAll({
            where: { customerid: customerId },
        });
        return domains;
    } catch (error) {
        console.error('Error fetching domains for customer:', error);
        throw new Error('Failed to fetch domains for customer');
    }
};

/**
 * Service to create or update a DNS record in a zone.
 *
 * @async
 * @function createDnsRecord
 * @param {string} zone - The name of the zone (e.g., "example.org.").
 * @param {object} record - The record details to create/update.
 * @param {string} record.name - The fully qualified domain name (FQDN) (e.g., "test.example.org.").
 * @param {string} record.type - The DNS record type (e.g., "A", "CNAME").
 * @param {number} record.ttl - The time-to-live for the record.
 * @param {Array<{content: string, disabled: boolean}>} record.records - The record values.
 * @returns {Promise<void>} A promise that resolves if the operation is successful.
 */
export const createDnsRecord = async (
    zone: string,
    record: {
        name: string;
        type: string;
        ttl: number;
        records: Array<{ content: string; disabled: boolean }>;
    }
): Promise<void> => {
    try {
        const rrsetData = {
            rrsets: [
                {
                    name: record.name,
                    type: record.type,
                    ttl: record.ttl,
                    changetype: "REPLACE",
                    records: record.records,
                },
            ],
        };

        await pdns.zones.updateZoneRRsets("localhost", zone, rrsetData);

        console.log(`Record created/updated successfully for zone: ${zone}`);
    } catch (error) {
        console.error("Error creating/updating DNS record:", error);
        throw new Error(`Failed to create/update record: ${error}`);
    }
};
