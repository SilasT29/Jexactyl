import { memo } from 'react';
import isEqual from 'react-fast-compare';
import { useTranslation } from 'react-i18next';
import { Alert } from '@/elements/alert';
import Can from '@/elements/Can';
import Spinner from '@/elements/Spinner';
import Console from '@server/console/Console';
import PowerButtons from '@server/console/PowerButtons';
import ServerDetailsBlock from '@server/console/ServerDetailsBlock';
import StatGraphs from '@server/console/StatGraphs';
import Features from '@feature/Features';
import { ServerContext, ServerStatus } from '@/state/server';
import classNames from 'classnames';
import { usePersistedState } from '@/plugins/usePersistedState';
import { useStoreState } from '@/state/hooks';
import Pill from '@/elements/Pill';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle, faDownload, faSpinner } from '@fortawesome/free-solid-svg-icons';
import EditServerDialog from './EditServerDialog';
import PageContentBlock from '@/elements/PageContentBlock';
import { timeUntil } from '../billing/ServerBillingContainer';

export type PowerAction = 'start' | 'stop' | 'restart' | 'kill';

function statusToColor(status: ServerStatus): string {
    switch (status) {
        case 'running':
            return 'text-green-500';
        case 'offline':
            return 'text-red-500';
        default:
            return 'text-yellow-500';
    }
}

function ServerConsoleContainer() {
    const user = useStoreState(state => state.user.data!);
    const uuid = ServerContext.useStoreState(state => state.server.data!.uuid);
    const name = ServerContext.useStoreState(state => state.server.data!.name);
    const description = ServerContext.useStoreState(state => state.server.data!.description);
    const isInstalling = ServerContext.useStoreState(state => state.server.isInstalling);
    const [expand, setExpand] = usePersistedState<boolean>(`console_expand_${user.uuid}`, false);
    const isTransferring = ServerContext.useStoreState(state => state.server.data!.isTransferring);
    const eggFeatures = ServerContext.useStoreState(state => state.server.data!.eggFeatures, isEqual);
    const isNodeUnderMaintenance = ServerContext.useStoreState(state => state.server.data!.isNodeUnderMaintenance);
    const status = ServerContext.useStoreState(state => state.status.value);
    const renewalDate = ServerContext.useStoreState(state => state.server.data!.renewalDate);
    const billingProductId = ServerContext.useStoreState(state => state.server.data!.billingProductId);
    const settings = useStoreState(state => state.everest.data!.billing);

    const { t } = useTranslation();

    const freeGraceDays = settings.renewal?.days || 7;

    const daysUntilRenewal = renewalDate
        ? Math.floor((new Date(renewalDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null;

    const showRenewalWarning =
        billingProductId &&
        daysUntilRenewal !== null &&
        daysUntilRenewal <= 0 &&
        Math.abs(daysUntilRenewal) <= freeGraceDays;

    return (
        <PageContentBlock title={t('console.title')} showFlashKey={'console:share'}>
            {showRenewalWarning && (
                <Alert type={'warning'} className={'mb-4'}>
                    {t('console.renewal_warning', {
                        days: Math.abs(daysUntilRenewal!).toString(),
                        days_plural: Math.abs(daysUntilRenewal!) === 1 ? '' : 's',
                        graceDays: freeGraceDays,
                    })}
                </Alert>
            )}
            {(isNodeUnderMaintenance || isInstalling || isTransferring) && (
                <Alert type={'warning'} className={'mb-4'}>
                    {isNodeUnderMaintenance
                        ? t('console.maintenance')
                        : isInstalling
                        ? t('console.installing_message')
                        : t('console.transferring_message')}
                </Alert>
            )}
            <div className={'mb-4 flex flex-col sm:flex-row sm:justify-between gap-4 bg-black/50 rounded-lg p-4 sm:p-5'}>
                <div className={'hidden pr-4 sm:col-span-2 sm:block lg:col-span-3'}>
                    <div className={'flex items-center space-x-2'}>
                        <h1 className={'font-header text-2xl leading-relaxed text-slate-50 line-clamp-1'}>{name}</h1>
                        <Pill>
                            {isInstalling && (
                                <>
                                    <FontAwesomeIcon icon={faDownload} className={'my-auto mr-1'} />
                                    {t('console.status.installing')}
                                </>
                            )}
                            {isTransferring && (
                                <>
                                    <FontAwesomeIcon icon={faSpinner} className={'animate-spin my-auto mr-1'} />
                                    {t('console.status.transferring')}
                                </>
                            )}
                            {!isInstalling && !isTransferring && (
                                <>
                                    <FontAwesomeIcon
                                        icon={faCircle}
                                        className={classNames('my-auto mr-1 w-2', statusToColor(status))}
                                    />
                                    {status}
                                </>
                            )}
                        </Pill>
                        <EditServerDialog />
                    </div>
                    <p className={'text-sm line-clamp-2'}>
                        {description ?? uuid}
                        {renewalDate && (
                            <span className={'ml-1'}>
                                &bull; {t('console.days_until_renewal', { days: timeUntil(renewalDate!).days })}
                            </span>
                        )}
                    </p>
                </div>
                <div className={'sm:my-auto w-full sm:w-auto'}>
                    <Can action={['control.start', 'control.stop', 'control.restart']} matchAny>
                        <PowerButtons className={'grid grid-cols-2 gap-2 sm:flex sm:space-x-2 sm:justify-center'} />
                    </Can>
                </div>
            </div>
            {!expand && <ServerDetailsBlock className={'order-last col-span-4 lg:order-none lg:col-span-1'} />}
            <div className={'mb-4 grid grid-cols-4 gap-2 sm:gap-4'}>
                <div className={classNames('col-span-4 flex', !expand && 'lg:col-span-3')}>
                    <Spinner.Suspense>
                        <Console expand={expand} setExpand={setExpand} />
                    </Spinner.Suspense>
                </div>
                {!expand && (
                    <div className={'col-span-4 lg:col-span-1 my-auto'}>
                        <div className={'grid grid-cols-1 gap-2'}>
                            <Spinner.Suspense>
                                <StatGraphs />
                            </Spinner.Suspense>
                        </div>
                    </div>
                )}
            </div>
            <Features enabled={eggFeatures} />
        </PageContentBlock>
    );
}

export default memo(ServerConsoleContainer, isEqual);
