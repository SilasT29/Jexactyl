import type { ComponentType, ElementType } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import * as Icon from '@heroicons/react/outline';

import PageContentBlock from '@/elements/PageContentBlock';
import FlashMessageRender from '@/elements/FlashMessageRender';
import MessageBox from '@/elements/MessageBox';
import { SubNavigation, SubNavigationLink } from '@/elements/SubNavigation';
import CredentialsContainer from '@account/security/CredentialsContainer';
import AccountApiContainer from '@account/AccountApiContainer';
import AccountSSHContainer from '@account/ssh/AccountSSHContainer';
import AccountPasskeyContainer from '@account/passkeys/AccountPasskeyContainer';
import { useTranslation } from 'react-i18next';

interface SecurityTab {
    path: string;
    name: string;
    title: string;
    description: string;
    icon: ElementType;
    component: ComponentType;
}

/**
 * Drives the sub-navigation, the nested routes, and the per-tab document title from one place.
 */
const useSecurityTabs = (): SecurityTab[] => {
    const { t } = useTranslation();
    return [
        {
            path: '',
            name: t('security.tabs.credentials'),
            title: t('security.tabs.credentials'),
            description: t('security.description'),
            icon: Icon.LockClosedIcon,
            component: CredentialsContainer,
        },
        {
            path: 'passkeys',
            name: t('security.tabs.passkeys'),
            title: t('security.tabs.passkeys'),
            description: t('security.description'),
            icon: Icon.FingerPrintIcon,
            component: AccountPasskeyContainer,
        },
        {
            path: 'ssh',
            name: t('security.tabs.ssh_keys'),
            title: t('security.tabs.ssh_keys'),
            description: t('security.description'),
            icon: Icon.TerminalIcon,
            component: AccountSSHContainer,
        },
        {
            path: 'api',
            name: t('security.tabs.api_credentials'),
            title: t('security.tabs.api_credentials'),
            description: t('security.description'),
            icon: Icon.CodeIcon,
            component: AccountApiContainer,
        },
    ];
};

const SecurityRouter = () => {
    const { t } = useTranslation();
    const { pathname, state } = useLocation();
    const tabs = useSecurityTabs();

    // The base tab is the fallback, so an unrecognised sub-path still renders sensible chrome.
    const active =
        tabs.find(tab => tab.path !== '' && pathname.startsWith(`/account/security/${tab.path}`)) ?? tabs[0]!;

    return (
        <PageContentBlock title={active.title}>
            {state?.twoFactorRedirect && (
                <MessageBox title={t('security.two_factor_required')} type="error">
                    {t('security.two_factor_required_message')}
                </MessageBox>
            )}

            <div className={'text-3xl lg:text-5xl font-bold mt-8 mb-8'}>
                {t('security.title')}
                <p className={'text-gray-400 font-normal text-sm mt-1'}>{active.description}</p>
            </div>

            <SubNavigation>
                {tabs.map(({ path, name, icon: TabIcon }) => (
                    <SubNavigationLink
                        key={path}
                        to={`/account/security${path && `/${path}`}`}
                        name={name}
                        base={path === ''}
                    >
                        <TabIcon />
                    </SubNavigationLink>
                ))}
            </SubNavigation>

            <FlashMessageRender byKey={'account'} />

            <Routes>
                {tabs.map(({ path, component: Component }) => (
                    <Route key={path} path={`/${path}`} element={<Component />} />
                ))}
            </Routes>
        </PageContentBlock>
    );
};

export default SecurityRouter;
