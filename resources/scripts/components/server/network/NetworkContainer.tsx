import { useEffect, useState } from 'react';
import Spinner from '@/elements/Spinner';
import { useFlashKey } from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import AllocationRow from '@server/network/AllocationRow';
import { Button } from '@/elements/button';
import { createAllocation, getAllocations } from '@/api/routes/server/allocations';
import tw from 'twin.macro';
import Can from '@/elements/Can';
import SpinnerOverlay from '@/elements/SpinnerOverlay';
import isEqual from 'react-fast-compare';
import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';
import PageContentBlock from '@/elements/PageContentBlock';
import { useTranslation } from 'react-i18next';

const NetworkContainer = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const uuid = ServerContext.useStoreState(state => state.server.data!.uuid);
    const allocationLimit = ServerContext.useStoreState(state => state.server.data!.featureLimits.allocations);
    const allocations = ServerContext.useStoreState(state => state.server.data!.allocations, isEqual);
    const setServerFromState = ServerContext.useStoreActions(actions => actions.server.setServerFromState);

    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network');
    const { data, error, mutate } = getAllocations();

    useEffect(() => {
        mutate(allocations);
    }, []);

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error]);

    useDeepCompareEffect(() => {
        if (!data) return;

        setServerFromState(state => ({ ...state, allocations: data }));
    }, [data]);

    const onCreateAllocation = () => {
        clearFlashes();

        setLoading(true);
        createAllocation(uuid)
            .then(allocation => {
                setServerFromState(s => ({ ...s, allocations: s.allocations.concat(allocation) }));
                return mutate(data?.concat(allocation), false);
            })
            .catch(error => clearAndAddHttpError(error))
            .then(() => setLoading(false));
    };

    return (
        <PageContentBlock
            showFlashKey={'server:network'}
            title={t('network.title')}
            header
            description={t('network.description')}
        >
            {!data ? (
                <Spinner size={'large'} centered />
            ) : (
                <>
                    {data.map(allocation => (
                        <AllocationRow key={`${allocation.ip}:${allocation.port}`} allocation={allocation} />
                    ))}
                    {allocationLimit > 0 && (
                        <Can action={'allocation.create'}>
                            <SpinnerOverlay visible={loading} />
                            <div css={tw`mt-6 sm:flex items-center justify-end`}>
                                <p css={tw`text-sm text-neutral-300 mb-4 sm:mr-6 sm:mb-0`}>
                                    {t('network.usage_status', { count: data.length, limit: allocationLimit })}
                                </p>
                                {allocationLimit > data.length && (
                                    <Button css={tw`w-full sm:w-auto`} color={'primary'} onClick={onCreateAllocation}>
                                        {t('network.create_allocation')}
                                    </Button>
                                )}
                            </div>
                        </Can>
                    )}
                </>
            )}
        </PageContentBlock>
    );
};

export default NetworkContainer;
