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
 * Created on 12/18/24 :: 4:22PM BY joyider <andre(-at-)sess.se>
 *
 * This file :: authService.ts is part of the solutrix-api project.
 */
import models from '../config/db';

export const fetchUserPermissions = async (userId: string): Promise<{ permissions: any } | null> => {
    try {
        const userRole = await models.user_role_customer.findOne({
            where: { userid: userId },
            include: [
                {
                    model: models.role,
                    as: 'role',
                    include: [
                        {
                            model: models.role_permissions,
                            as: 'role_permissions',
                        },
                    ],
                },
            ],
        });

        if (!userRole || !userRole.role) {
            console.error('Role not found for user:', userId);
            return null;
        }

        const rolePermissions = await models.role_permissions.findOne({
            where: { rolename: userRole.role.rolename },
            attributes: ['permissions'],
        });

        if (!rolePermissions) {
            console.error('Permissions not found for role:', userRole.role.rolename);
            return null;
        }

        return { permissions: rolePermissions.permissions };
    } catch (error) {
        console.error('Error fetching user permissions:', error);
        throw error; // Re-throw the error to handle it at the caller level
    }
};
