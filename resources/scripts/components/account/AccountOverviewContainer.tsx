import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import tw from 'twin.macro';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

import ContentBox from '@/elements/ContentBox';
import PageContentBlock from '@/elements/PageContentBlock';
import CopyOnClick from '@/elements/CopyOnClick';
import UpdateAvatarForm from '@account/forms/UpdateAvatarForm';
import { useStoreState } from '@/state/hooks';
import Switch from '@/elements/Switch';
import { usePrivacyModeState } from '@/hooks/usePrivacyModeState';
import { maskEmail } from '@/hooks/usePrivacyMode';
import { getPanelLanguage, setPanelLanguage } from '@/i18n';

const Container = styled.div`
    ${tw`flex flex-col gap-8 lg:gap-0 lg:grid lg:grid-cols-2 mb-10 mt-10 w-full max-w-full`};

    & > div {
        ${tw`w-full min-w-0`};
    }
`;

const Detail = ({ label, children }: { label: string; children: ReactNode }) => (
    <div css={tw`flex justify-between items-baseline gap-4 py-3 border-b border-neutral-700 last:border-b-0`}>
        <p css={tw`text-xs text-gray-400 uppercase whitespace-nowrap`}>{label}</p>
        <div css={tw`text-sm text-right break-words min-w-0`}>{children}</div>
    </div>
);

export default () => {
    const { t } = useTranslation();
    const user = useStoreState(state => state.user.data!);
    const { enabled, setEnabled } = usePrivacyModeState();
    const [language, setLanguage] = useState(getPanelLanguage());

    const displayEmail = enabled ? maskEmail(user.email) : user.email;

    return (
        <PageContentBlock title={String(t('account.title'))} header description={String(t('account.description'))}>
            <Container>
                <ContentBox title={String(t('account.avatar'))} showFlashes="account:avatar">
                    <UpdateAvatarForm />
                </ContentBox>

                <ContentBox css={tw`lg:ml-8`} title={String(t('account.account_information'))}>
                    <Detail label={String(t('account.username'))}>{user.username}</Detail>
                    <Detail label={String(t('account.email_address'))}>{displayEmail}</Detail>
                    <Detail label={String(t('account.account_id'))}>
                        <CopyOnClick text={user.uuid}>
                            <code css={tw`font-mono text-xs`}>{user.uuid}</code>
                        </CopyOnClick>
                    </Detail>
                    {user.roleName && <Detail label={String(t('account.role'))}>{user.roleName}</Detail>}
                    <Detail label={String(t('account.member_since'))}>{format(user.createdAt, 'MMMM do, yyyy')}</Detail>
                    <div css={tw`mt-6 pt-4 border-t border-neutral-700`}>
                        <div css={tw`mb-4`}>
                            <label css={tw`block text-sm font-medium text-neutral-300 mb-2`}>{String(t('language.label'))}</label>
                            <select
                                css={tw`w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm text-neutral-200 focus:border-green-400 focus:outline-none`}
                                value={language}
                                onChange={e => {
                                    const lang = e.target.value as 'en' | 'de';
                                    setPanelLanguage(lang);
                                    setLanguage(lang);
                                }}
                            >
                                <option value={'en'}>{String(t('language.english'))}</option>
                                <option value={'de'}>{String(t('language.german'))}</option>
                            </select>
                        </div>
                        <Switch
                            name={'privacy_mode'}
                            label={String(t('privacy_mode.label'))}
                            description={String(t('privacy_mode.description'))}
                            defaultChecked={enabled}
                            onChange={() => setEnabled(!enabled)}
                        />
                    </div>
                    <p css={tw`text-xs text-gray-400 mt-6`}>
                        {t('account.security_note')}{' '}
                        <Link to={'/account/security'} css={tw`text-green-400 hover:text-green-200 duration-300`}>
                            {String(t('account.security_link'))}
                        </Link>
                        .
                    </p>
                </ContentBox>
            </Container>
        </PageContentBlock>
    );
};
