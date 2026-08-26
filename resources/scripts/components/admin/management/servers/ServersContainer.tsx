import { NavLink } from 'react-router-dom';
import tw from 'twin.macro';
import FlashMessageRender from '@/elements/FlashMessageRender';
import AdminContentBlock from '@/elements/AdminContentBlock';
import ServersTable from '@admin/management/servers/ServersTable';
import { Button } from '@/elements/button';
import { AdjustmentsIcon, ArchiveIcon, TerminalIcon } from '@heroicons/react/outline';
import { SubNavigation, SubNavigationLink } from '@admin/SubNavigation';
import PresetCreationDialog from './PresetCreationDialog';
import { useTranslation } from 'react-i18next';

export default () => {
    const { t } = useTranslation();

    return (
        <AdminContentBlock title={t('admin.servers.title')}>
            <div css={tw`w-full flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-0 mb-8`}>
                <div css={tw`flex flex-col flex-shrink w-full sm:w-auto`} style={{ minWidth: '0' }}>
                    <h2 css={tw`text-2xl text-neutral-50 font-header font-medium`}>{t('admin.servers.title')}</h2>
                    <p
                        css={tw`hidden md:block text-base text-neutral-400 whitespace-nowrap overflow-ellipsis overflow-hidden`}
                    >
                        {t('admin.servers.subtitle')}
                    </p>
                </div>

                <div css={tw`flex flex-col sm:flex-row sm:ml-auto sm:pl-4 w-full sm:w-auto gap-2 sm:gap-4`}>
                    <NavLink to={`/admin/servers/new`} className={'w-full sm:w-auto'}>
                        <Button.Text type={'button'} size={Button.Sizes.Large} css={tw`h-10 px-4 py-0 whitespace-nowrap`}>
                            {t('admin.servers.create')}
                        </Button.Text>
                    </NavLink>
                    <PresetCreationDialog className={'w-full sm:w-auto'} />
                </div>
            </div>

            <FlashMessageRender byKey={'servers'} css={tw`mb-4`} />

            <SubNavigation>
                <SubNavigationLink to="/admin/servers" name={t('admin.servers.all_servers')} base>
                    <TerminalIcon />
                </SubNavigationLink>
                <SubNavigationLink to="/admin/servers/presets" name={t('admin.servers.presets')}>
                    <AdjustmentsIcon />
                </SubNavigationLink>
                <SubNavigationLink to="/admin/nests" name={t('admin.servers.nests')}>
                    <ArchiveIcon />
                </SubNavigationLink>
            </SubNavigation>

            <ServersTable />
        </AdminContentBlock>
    );
};
