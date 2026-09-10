import { useEffect, useMemo, useState } from 'react';
import { type Server } from '@definitions/server';
import getServers from '@/api/getServers';
import ServerRow from '@account/ServerRow';
import PageContentBlock from '@/elements/PageContentBlock';
import useFlash from '@/plugins/useFlash';
import { useStoreState } from 'easy-peasy';
import { usePersistedState } from '@/plugins/usePersistedState';
import Switch from '@/elements/Switch';
import tw from 'twin.macro';
import useSWR from 'swr';
import { PaginatedResult } from '@/api/http';
import Pagination from '@/elements/Pagination';
import { Link, useLocation } from 'react-router-dom';
import ContentBox from '@/elements/ContentBox';
import FlashMessageRender from '@/elements/FlashMessageRender';
import NotFoundSvg from '@/assets/images/not_found.svg';
import DashboardAlert from '@account/DashboardAlert';
import ServerSvg from '@/assets/images/themed/ServerSvg';
import { Button } from '@/elements/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleArrowRight, faLayerGroup, faPlay, faRotate, faStop } from '@fortawesome/free-solid-svg-icons';
import { getServerGroups } from '@/api/routes/server/groups';
import { type ServerGroup } from '@definitions/server';
import ServerGroupDialog, { VisibleDialog } from '@account/groups/ServerGroupDialog';
import ActivityLogContainer from './activity/ActivityLogContainer';
import classNames from 'classnames';
import { BulkPowerSignal, bulkPowerAction } from '@/api/routes/server/bulkPower';
import { Dialog } from '@/elements/dialog';
import { useTranslation } from 'react-i18next';

export default () => {
    const { search } = useLocation();
    const defaultPage = Number(new URLSearchParams(search).get('page') || '1');
    const { t } = useTranslation();

    const [open, setOpen] = useState<VisibleDialog>({ open: 'none', serverId: undefined });
    const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; group?: ServerGroup; signal?: BulkPowerSignal }>(
        { open: false },
    );
    const [bulkResult, setBulkResult] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [running, setRunning] = useState(false);
    const colors = useStoreState(state => state.theme.data!.colors);

    const [groups, setGroups] = useState<ServerGroup[]>([]);
    const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);
    const { clearFlashes, clearAndAddHttpError, addFlash, clearFlashes: clearFlashesByKey } = useFlash();
    const name = useStoreState(state => state.settings.data!.name);
    const uuid = useStoreState(state => state.user.data!.uuid);
    const user = useStoreState(state => state.user.data!);
    const billing = useStoreState(state => state.everest.data!.billing.enabled);
    const activityEnabled = useStoreState(state => state.settings.data!.activity.enabled.account);
    const [showOnlyAdmin, setShowOnlyAdmin] = usePersistedState(`${uuid}:show_all_servers`, false);

    const { data: servers, error } = useSWR<PaginatedResult<Server>>(
        ['/api/client/servers', showOnlyAdmin && user.rootAdmin, page],
        () => getServers({ page, type: showOnlyAdmin && user.rootAdmin ? 'admin' : undefined, per_page: 4 }),
    );

    const serversByGroup = useMemo(() => {
        const map = new Map<number, Server[]>();
        servers?.items.forEach(server => {
            if (!server.groupId) return;
            const list = map.get(server.groupId) || [];
            list.push(server);
            map.set(server.groupId, list);
        });
        return map;
    }, [servers?.items]);

    const openConfirm = (group: ServerGroup, signal: BulkPowerSignal) => {
        clearFlashesByKey('dashboard:groups');
        setBulkResult(null);
        setConfirmDialog({ open: true, group, signal });
    };

    const onConfirmBulkPower = () => {
        const { group, signal } = confirmDialog;
        if (!group || !signal) return;

        const targets = serversByGroup.get(group.id)?.map(s => s.uuid) || [];
        if (targets.length === 0) {
            setBulkResult({ type: 'info', message: t('groups.bulk_power.empty', { name: group.name }) });
            setConfirmDialog({ open: false });
            return;
        }

        setRunning(true);
        clearFlashesByKey('dashboard:groups');
        bulkPowerAction(targets, signal)
            .then(result => {
                const key = result.failed > 0 ? 'error' : 'success';
                setBulkResult({
                    type: key,
                    message: t(`groups.bulk_power.result.${key}`, {
                        signal: t(`groups.bulk_power.signals.${signal}`),
                        total: result.total,
                        success: result.success,
                        failed: result.failed,
                    }),
                });
                addFlash({
                    type: key,
                    key: 'dashboard:groups',
                    message: t(`groups.bulk_power.result.${key}`, {
                        signal: t(`groups.bulk_power.signals.${signal}`),
                        total: result.total,
                        success: result.success,
                        failed: result.failed,
                    }),
                });
            })
            .catch(error => clearAndAddHttpError({ key: 'dashboard:groups', error }))
            .finally(() => {
                setRunning(false);
                setConfirmDialog({ open: false });
            });
    };

    useEffect(() => {
        getServerGroups()
            .then(data => setGroups(data))
            .catch(() => console.error());
    }, []);

    useEffect(() => {
        if (!servers) return;
        if (servers.pagination.currentPage > 1 && !servers.items.length) {
            setPage(1);
        }
    }, [servers?.pagination.currentPage]);

    useEffect(() => {
        // Don't use react-router to handle changing this part of the URL, otherwise it
        // triggers a needless re-render. We just want to track this in the URL incase the
        // user refreshes the page.
        window.history.replaceState(null, document.title, `/${page <= 1 ? '' : `?page=${page}`}`);
    }, [page]);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'dashboard', error });
        if (!error) clearFlashes('dashboard');
    }, [error]);

    return (
        <PageContentBlock title={t('dashboard.title', { appName: name })} header description={t('dashboard.signed_in_as', { email: user.email })}>
            <DashboardAlert />
            {open && <ServerGroupDialog open={open} setOpen={setOpen} groups={groups} setGroups={setGroups} />}
            {confirmDialog.open && confirmDialog.group && confirmDialog.signal && (
                <Dialog.Confirm
                    open={confirmDialog.open}
                    onClose={() => {
                        if (!running) setConfirmDialog({ open: false });
                    }}
                    title={t('groups.bulk_power.confirm_title', {
                        signal: t(`groups.bulk_power.signals.${confirmDialog.signal}`),
                        name: confirmDialog.group.name,
                    })}
                    confirm={t('groups.bulk_power.confirm_button')}
                    buttonType={confirmDialog.signal === 'stop' || confirmDialog.signal === 'kill' ? 'danger' : 'success'}
                    onConfirmed={onConfirmBulkPower}
                >
                    <p>
                        {t('groups.bulk_power.confirm_message', {
                            signal: t(`groups.bulk_power.signals.${confirmDialog.signal}`),
                            count: serversByGroup.get(confirmDialog.group.id)?.length || 0,
                            name: confirmDialog.group.name,
                        })}
                    </p>
                </Dialog.Confirm>
            )}
            <FlashMessageRender className={'my-4'} byKey={'dashboard'} />
            <FlashMessageRender className={'my-4'} byKey={'dashboard:groups'} />
            {bulkResult && (
                <div
                    className={classNames(
                        'mb-4 px-4 py-3 rounded-lg border text-sm',
                        bulkResult.type === 'success'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                            : bulkResult.type === 'error'
                            ? 'bg-red-500/10 border-red-500/20 text-red-200'
                            : 'bg-blue-500/10 border-blue-500/20 text-blue-200',
                    )}
                >
                    {bulkResult.message}
                </div>
            )}
            <div className={classNames('grid gap-4', activityEnabled ? 'lg:grid-cols-3' : 'lg:grid-cols-2')}>
                <div className="relative overflow-x-hidden lg:col-span-2">
                    <div css={tw`mb-4 px-4`}>
                        <div className={'flex items-center justify-between gap-3 mb-3 w-full'}>
                            <h2 className={'text-neutral-300 text-xl sm:text-2xl whitespace-nowrap overflow-hidden text-ellipsis leading-none py-1'}>
                                {showOnlyAdmin ? t('dashboard.other_servers') : t('dashboard.your_servers')}
                            </h2>
                            <div className={'flex items-center gap-2 flex-shrink-0'}>
                                <Button.Text
                                    shape={Button.Shapes.IconSquare}
                                    size={Button.Sizes.Small}
                                    className={'flex-none !h-9 !w-9'}
                                    onClick={() => setOpen({ open: 'index' })}
                                    title={t('groups.title')}
                                >
                                    <FontAwesomeIcon icon={faLayerGroup} />
                                </Button.Text>
                            </div>
                        </div>
                        <div className={'flex flex-col sm:flex-row sm:items-center gap-3'}>
                            {user.rootAdmin && (
                                <>
                                    <Switch
                                        name={'show_all_servers'}
                                        defaultChecked={showOnlyAdmin}
                                        onChange={() => setShowOnlyAdmin(s => !s)}
                                    />
                                    <span css={tw`text-sm text-neutral-400`}>{t('dashboard.show_all_servers')}</span>
                                </>
                            )}
                            <div className={'sm:ml-auto flex items-center gap-2 flex-wrap'}>
                                {groups.map(group => {
                                    const groupServers = serversByGroup.get(group.id);
                                    if (!groupServers || groupServers.length === 0) return null;
                                    return (
                                        <div
                                            key={group.id}
                                            className={'flex items-center rounded-lg border border-white/10 bg-white/[0.03] pl-2 pr-1'}
                                        >
                                            <span className={'text-xs font-medium mr-2'} style={{ color: group.color }}>
                                                {group.name}
                                            </span>
                                            <div className={'flex items-center gap-0.5'}>
                                                <Button.Text
                                                    size={Button.Sizes.Small}
                                                    shape={Button.Shapes.IconSquare}
                                                    className={'!h-7 !w-7 text-emerald-400 hover:text-emerald-300'}
                                                    onClick={() => openConfirm(group, 'start')}
                                                    title={t('groups.bulk_power.start_group')}
                                                >
                                                    <FontAwesomeIcon icon={faPlay} size={'xs'} />
                                                </Button.Text>
                                                <Button.Text
                                                    size={Button.Sizes.Small}
                                                    shape={Button.Shapes.IconSquare}
                                                    className={'!h-7 !w-7 text-amber-400 hover:text-amber-300'}
                                                    onClick={() => openConfirm(group, 'restart')}
                                                    title={t('groups.bulk_power.restart_group')}
                                                >
                                                    <FontAwesomeIcon icon={faRotate} size={'xs'} />
                                                </Button.Text>
                                                <Button.Text
                                                    size={Button.Sizes.Small}
                                                    shape={Button.Shapes.IconSquare}
                                                    className={'!h-7 !w-7 text-red-400 hover:text-red-300'}
                                                    onClick={() => openConfirm(group, 'stop')}
                                                    title={t('groups.bulk_power.stop_group')}
                                                >
                                                    <FontAwesomeIcon icon={faStop} size={'xs'} />
                                                </Button.Text>
                                            </div>
                                        </div>
                                    );
                                })}

                            </div>
                        </div>
                    </div>
                    {!servers || servers.items.length < 1 ? (
                        <ContentBox>
                            <div className={'text-gray-400'}>
                                <div className={'grid lg:grid-cols-2 gap-6 m-4'}>
                                    <ServerSvg color={colors.primary} />
                                    <div>
                                        <h1 className={'text-gray-200 text-2xl font-bold'}>{t('dashboard.deploy_title')}</h1>
                                        <div className={'mt-2'}>
                                            {t('dashboard.no_servers')}&nbsp;
                                            {billing ? (
                                                <>
                                                    {t('dashboard.deploy_description_billing')}
                                                    <div className={'text-right'}>
                                                        <Link to={'/account/billing/order'}>
                                                            <Button className={'w-1/2 text-white font-normal'}>
                                                                {t('dashboard.view_options')}{' '}
                                                                <FontAwesomeIcon icon={faCircleArrowRight} className={'ml-2'} />
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </>
                                            ) : (
                                                <>{t('dashboard.deploy_description_support')}</>
                                            )}
                                        </div>
                                        <div className={'mt-2 text-sm text-neutral-400'}>
                                            {t('dashboard.contact_support')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ContentBox>
                    ) : (
                        <Pagination data={servers} onPageSelect={setPage}>
                            {({ items }) =>
                                items.length > 0 ? (
                                    items.map((server, _index) => (
                                        <>
                                            <ServerRow
                                                key={server.uuid}
                                                server={server}
                                                setOpen={setOpen}
                                                group={groups.find(x => x.id === server.groupId)}
                                            />
                                        </>
                                    ))
                                ) : (
                                    <div className={'w-full'} style={{ backgroundColor: colors.secondary }}>
                                        <div className={'px-6 py-4 text-gray-300'}>
                                            <div css={tw`flex justify-center`}>
                                                <div css={tw`w-full sm:w-3/4 md:w-1/2 rounded-lg text-center relative`}>
                                                    <img src={NotFoundSvg} css={tw`w-2/3 h-auto select-none mx-auto`} />
                                                    <h2 css={tw`mt-10 mb-6 text-white font-medium text-xl`}>
                                                        {t('dashboard.no_servers')}
                                                    </h2>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }
                        </Pagination>
                    )}
                </div>
                {activityEnabled && (
                    <ContentBox title={t('dashboard.account_activity')}>
                        <ActivityLogContainer />
                    </ContentBox>
                )}
            </div>
        </PageContentBlock>
    );
};
