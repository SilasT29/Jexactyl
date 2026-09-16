import tw from 'twin.macro';
import styled from 'styled-components';

import ContentBox from '@/elements/ContentBox';
import UpdatePasswordForm from '@account/forms/UpdatePasswordForm';
import UpdateEmailAddressForm from '@account/forms/UpdateEmailAddressForm';
import ConfigureTwoFactorForm from '@account/forms/ConfigureTwoFactorForm';
import { useTranslation } from 'react-i18next';

const Container = styled.div`
    ${tw`flex flex-col gap-8 lg:grid lg:grid-cols-3 lg:gap-8 my-10 w-full max-w-full`};

    & > div {
        ${tw`w-full min-w-0`};
    }
`;

export default () => {
    const { t } = useTranslation();

    return (
        <Container>
            <ContentBox title={t('security.update_password')} showFlashes="account:password">
                <UpdatePasswordForm />
            </ContentBox>

            <ContentBox title={t('security.update_email_address')} showFlashes="account:email">
                <UpdateEmailAddressForm />
            </ContentBox>

            <ContentBox title={t('security.two_step_verification')}>
                <ConfigureTwoFactorForm />
            </ContentBox>
        </Container>
    );
};
