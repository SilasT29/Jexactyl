import { forwardRef, useEffect, useState } from 'react';
import * as React from 'react';
import { Form } from 'formik';
import styled from 'styled-components';
import tw from 'twin.macro';
import { useStoreState } from 'easy-peasy';
import { useTranslation } from 'react-i18next';
import FlashMessageRender from '@/elements/FlashMessageRender';

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & {
    title?: string;
};

const PageWrapper = styled.div`
    ${tw`min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden`};

    /* reCAPTCHA-Badge ausblenden (Funktion bleibt) */
    .grecaptcha-badge {
        opacity: 0 !important;
        pointer-events: none !important;
    }
`;

const FormCard = styled.div<{ isVisible: boolean }>`
    ${tw`relative z-10 w-full max-w-md`};
    opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
    transform: ${({ isVisible }) => (isVisible ? 'translateY(0)' : 'translateY(10px)')};
    transition: opacity 0.5s ease-in, transform 0.5s ease-out;
`;

export default forwardRef<HTMLFormElement, Props>(({ title, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const { t } = useTranslation();
    const recaptchaEnabled = useStoreState(state => state.settings.data!.recaptcha.enabled);

    useEffect(() => {
        const timeout = setTimeout(() => setVisible(true), 50);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <PageWrapper>
            <FormCard isVisible={visible}>
                {title && <h2 css={tw`text-3xl text-center text-neutral-100 font-medium py-4 drop-shadow-lg`}>{title}</h2>}
                <FlashMessageRender css={tw`mb-2 px-1`} />
                <Form {...props} ref={ref}>
                    <div css={tw`w-full bg-zinc-900/80 backdrop-blur-md shadow-2xl rounded-lg p-6 border border-neutral-700`}>
                        <div css={tw`flex-1`}>{props.children}</div>
                    </div>
                </Form>
                {recaptchaEnabled && (
                    <p css={tw`text-center text-neutral-400 text-[10px] mt-2 drop-shadow`}>
                        {String(t('auth.login.recaptcha_notice'))}
                    </p>
                )}
                <p css={tw`text-center text-neutral-300 text-xs mt-4 drop-shadow`}>
                    &copy; {new Date().getFullYear()}&nbsp;Powered by&nbsp;
                    <a
                        rel={'noopener nofollow noreferrer'}
                        href={'https://silast29.de'}
                        target={'_blank'}
                        css={tw`no-underline text-neutral-300 hover:text-green-400 duration-300`}
                    >
                        SilasT29.de
                    </a>
                </p>
            </FormCard>
        </PageWrapper>
    );
});
