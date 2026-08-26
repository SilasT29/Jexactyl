import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import tw from 'twin.macro';
import AdminContentBlock from '@/elements/AdminContentBlock';
import FlashMessageRender from '@/elements/FlashMessageRender';
import useFlash from '@/plugins/useFlash';
import {
    faArrowRight,
    faChartLine,
    faCoins,
    faDatabase,
    faDesktop,
    faHeart,
    faLayerGroup,
    faQuestionCircle,
    faRecycle,
    faSave,
    faServer,
    faTicket,
    faUserPlus,
    faUsers,
    IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import AdminBox from '@/elements/AdminBox';
import Spinner from '@/elements/Spinner';
import { useStoreState } from '@/state/hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import { Alert } from '@/elements/alert';
import getMetrics, { MetricData } from '@/api/routes/admin/getMetrics';
import getVersion, { VersionData } from '@/api/routes/admin/getVersion';
import { useTranslation } from 'react-i18next';

interface SuggestionProps {
    icon: IconDefinition;
    title: string;
    description: string;
    link: string;
    action?: string;
}

const SuggestionCard = ({ icon, title, description, link, action }: SuggestionProps) => {
    const { colors } = useStoreState(state => state.theme.data!);

    return (
        <div className={'bg-black/25 p-3 lg:p-6 rounded-lg'}>
            <h1 className={'text-xl font-semibold mb-2'}>
                <FontAwesomeIcon icon={icon} /> {title}
            </h1>
            <p className={'text-gray-300'}>{description}</p>
            <p className={'mt-2 text-right text-sm'} style={{ color: colors.primary }}>
                <Link to={link}>
                    {action ?? 'Manage'} <FontAwesomeIcon icon={faArrowRight} />
                </Link>
            </p>
        </div>
    );
};

interface StatProps {
    icon: IconDefinition;
    title: string;
    value: ReactNode;
    subtext?: string;
}

const StatCard = ({ icon, title, value, subtext }: StatProps) => {
    const { colors } = useStoreState(state => state.theme.data!);

    return (
        <div className={'bg-black/25 p-3 lg:p-4 rounded-lg'}>
            <p className={'text-sm text-gray-400'}>
                <FontAwesomeIcon icon={icon} style={{ color: colors.primary }} /> {title}
            </p>
            <p className={'text-2xl font-semibold mt-1'}>{value}</p>
            {subtext && <p className={'text-xs text-gray-400 mt-1'}>{subtext}</p>}
        </div>
    );
};

export default () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState<boolean>(true);
    const { clearFlashes, clearAndAddHttpError } = useFlash();

    const everest = useStoreState(state => state.everest.data!);
    const settings = useStoreState(state => state.settings.data!);

    const [metricData, setMetricData] = useState<MetricData | undefined>(undefined);
    const [versionData, setVersionData] = useState<VersionData | undefined>(undefined);

    useEffect(() => {
        clearFlashes('overview');

        getVersion()
            .then(versionData => setVersionData(versionData))
            .catch(error => {
                clearAndAddHttpError({ key: 'overview', error });
            })
            .then(() => setLoading(false));

        getMetrics()
            .then(metricData => setMetricData(metricData))
            .catch(error => {
                clearAndAddHttpError({ key: 'overview', error });
            });
    }, []);

    return (
        <AdminContentBlock title={t('admin.overview.title')}>
            <div css={tw`w-full flex flex-row items-center mb-8`}>
                <div css={tw`flex flex-col flex-shrink`} style={{ minWidth: '0' }}>
                    <h2 css={tw`text-2xl text-neutral-50 font-header font-medium`}>{t('admin.overview.title')}</h2>
                    <p
                        css={tw`hidden md:block text-base text-neutral-400 whitespace-nowrap overflow-ellipsis overflow-hidden`}
                    >
                        {t('admin.overview.subtitle')}
                    </p>
                </div>
            </div>

            <FlashMessageRender byKey={'overview'} css={tw`mb-4`} />

            <AdminBox title={t('admin.overview.version_info')} icon={faDesktop}>
                {settings.debug && (
                    <Alert type={'warning'} className={'mb-3'}>
                        {t('admin.overview.debug_warning')}
                    </Alert>
                )}
                {loading ? (
                    <Spinner size={'large'} centered />
                ) : (
                    <>
                        <div className={'text-gray-200 mb-2'}>
                            {t('admin.overview.current_version', {
                                current: versionData?.panel.current,
                                latest: versionData?.panel.latest,
                            })}
                        </div>
                        {versionData?.panel.current.startsWith('v4.0.0-') && (
                            <Alert type={'danger'} className={'mt-4'}>
                                {t('admin.overview.beta_warning')}
                            </Alert>
                        )}
                    </>
                )}
            </AdminBox>
            <AdminBox title={t('admin.overview.statistics')} className={'mt-6'} icon={faChartLine}>
                {loading || !metricData ? (
                    <Spinner size={'large'} centered />
                ) : (
                    <div className={'grid grid-cols-2 lg:grid-cols-4 gap-4'}>
                        <StatCard icon={faLayerGroup} title={t('admin.overview.nodes')} value={metricData.nodes} />
                        <StatCard
                            icon={faServer}
                            title={t('admin.overview.servers')}
                            value={metricData.servers.total}
                            subtext={
                                metricData.servers.suspended > 0 || metricData.servers.installing > 0
                                    ? [
                                          metricData.servers.suspended > 0
                                              ? `${metricData.servers.suspended} ${t('admin.overview.suspended')}`
                                              : null,
                                          metricData.servers.installing > 0
                                              ? `${metricData.servers.installing} ${t('admin.overview.installing')}`
                                              : null,
                                      ]
                                          .filter(Boolean)
                                          .join(', ')
                                    : undefined
                            }
                        />
                        <StatCard
                            icon={faUsers}
                            title={t('admin.overview.users')}
                            value={metricData.users.total}
                            subtext={`${metricData.users.admins} ${t('admin.overview.administrators')}`}
                        />
                        <StatCard icon={faTicket} title={t('admin.overview.pending_tickets')} value={metricData.tickets} />
                        <StatCard icon={faDatabase} title={t('admin.overview.databases')} value={metricData.databases} />
                        <StatCard icon={faSave} title={t('admin.overview.backups')} value={metricData.backups} />
                        {metricData.billing && (
                            <>
                                <StatCard
                                    icon={faCoins}
                                    title={t('admin.overview.revenue')}
                                    value={`${everest.billing.currency.symbol}${metricData.billing.revenue.toFixed(2)}`}
                                    subtext={`${metricData.billing.orders_this_month} ${t('admin.overview.orders_this_month')}`}
                                />
                                <StatCard
                                    icon={faQuestionCircle}
                                    title={t('admin.overview.pending_orders')}
                                    value={metricData.billing.orders_pending}
                                    subtext={`${metricData.billing.products} ${t('admin.overview.products_available')}`}
                                />
                            </>
                        )}
                    </div>
                )}
            </AdminBox>
            <AdminBox title={t('admin.overview.suggested_actions')} className={'mt-6'} icon={faQuestionCircle}>
                <div className={'grid lg:grid-cols-3 gap-4'}>
                    {!settings.auto_update && (
                        <SuggestionCard
                            icon={faRecycle}
                            link={'/admin/settings'}
                            title={t('admin.overview.auto_updates_title')}
                            description={t('admin.overview.auto_updates_description')}
                        />
                    )}
                    {!everest.auth.registration.enabled && (
                        <SuggestionCard
                            icon={faUserPlus}
                            link={'/admin/auth'}
                            title={t('admin.overview.registration_title')}
                            description={t('admin.overview.registration_description')}
                        />
                    )}
                    {metricData && (
                        <>
                            {metricData.nodes < 1 && (
                                <SuggestionCard
                                    icon={faLayerGroup}
                                    link={'/admin/nodes/new'}
                                    title={t('admin.overview.first_node_title')}
                                    description={t('admin.overview.first_node_description')}
                                />
                            )}
                            {metricData.servers.total < 1 && (
                                <SuggestionCard
                                    icon={faServer}
                                    link={'/admin/servers/new'}
                                    title={t('admin.overview.first_server_title')}
                                    description={t('admin.overview.first_server_description')}
                                />
                            )}
                            {everest.tickets.enabled && metricData.tickets > 0 && (
                                <SuggestionCard
                                    icon={faTicket}
                                    link={'/admin/tickets'}
                                    title={t('admin.overview.tickets_title')}
                                    description={t('admin.overview.tickets_description', { count: metricData.tickets })}
                                />
                            )}
                            {metricData.billing && metricData.billing.orders_pending > 0 && (
                                <SuggestionCard
                                    icon={faCoins}
                                    link={'/admin/billing/orders'}
                                    title={t('admin.overview.billing_orders_title')}
                                    description={t('admin.overview.billing_orders_description', {
                                        count: metricData.billing.orders_pending,
                                    })}
                                />
                            )}
                        </>
                    )}
                    <SuggestionCard
                        icon={faHeart}
                        link={'https://github.com/sponsors/Jexactyl'}
                        title={t('admin.overview.donate_title')}
                        action={t('admin.overview.donate_action')}
                        description={t('admin.overview.donate_description')}
                    />
                </div>
            </AdminBox>
        </AdminContentBlock>
    );
};
