import http from '@/api/http';

export type BulkPowerSignal = 'start' | 'stop' | 'restart' | 'kill';

export interface BulkPowerResult {
    signal: BulkPowerSignal;
    total: number;
    success: number;
    failed: number;
    errors: { uuid: string; message: string }[];
}

const sendServerPowerSignal = (uuid: string, signal: BulkPowerSignal): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${uuid}/power`, { signal })
            .then(() => resolve())
            .catch(reject);
    });
};

export const bulkPowerAction = async (uuids: string[], signal: BulkPowerSignal): Promise<BulkPowerResult> => {
    const result: BulkPowerResult = {
        signal,
        total: uuids.length,
        success: 0,
        failed: 0,
        errors: [],
    };

    await Promise.all(
        uuids.map(async uuid => {
            try {
                await sendServerPowerSignal(uuid, signal);
                result.success++;
            } catch (error: any) {
                result.failed++;
                result.errors.push({
                    uuid,
                    message: error?.response?.data?.errors?.[0]?.detail || error.message || 'Unknown error',
                });
            }
        }),
    );

    return result;
};
