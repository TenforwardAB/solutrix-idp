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
 * Created on 12/9/24 :: 7:29PM BY joyider <andre(-at-)sess.se>
 *
 * This file :: fileTrekkerError.ts is part of the solutrix-api project.
 */

import { AxiosError } from 'axios';

interface CustomError {
    status: number;
    message: string;
    details?: any;
}

export function fileTrekkerError(error: unknown): CustomError {
    if (isAxiosError(error)) {
        const axiosError = error as AxiosError;

        const message =
            axiosError.response?.data &&
            typeof axiosError.response.data === 'object' &&
            'error' in axiosError.response.data
                ? (axiosError.response.data as { error: string }).error
                : axiosError.message || 'An unexpected error occurred';

        return {
            status: axiosError.response?.status || 500,
            message,
            details: axiosError.response?.data || null,
        };
    }
    return {
        status: 500,
        message: 'An unexpected error occurred',
    };
}

function isAxiosError(error: unknown): error is AxiosError {
    return (error as AxiosError).isAxiosError !== undefined;
}
