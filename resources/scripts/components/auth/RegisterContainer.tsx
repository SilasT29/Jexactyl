import { useStoreState } from 'easy-peasy';
import type { FormikHelpers } from 'formik';
import { Formik, Field as FormikField } from 'formik';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Reaptcha from 'reaptcha';
import tw from 'twin.macro';
import { object, string, boolean } from 'yup';

import LoginFormContainer from '@/components/auth/LoginFormContainer';
import Field from '@/elements/Field';
import { Button } from '@/elements/button';
import useFlash from '@/plugins/useFlash';
import register from '@/api/routes/auth/register';
import { login } from '@/api/routes/auth/login';
import { faAt, faIdBadge, faKey, faUnlockKeyhole } from '@fortawesome/free-solid-svg-icons';

interface Values {
    username: string;
    email: string;
    password: string;
    confirm_password: string;
    accept_privacy: boolean;
}

function RegisterContainer() {
    const { t } = useTranslation();
    const ref = useRef<Reaptcha>(null);
    const token = useRef('');

    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { enabled: recaptchaEnabled, siteKey } = useStoreState(state => state.settings.data!.recaptcha);

    useEffect(() => {
        clearFlashes();
    }, []);

    const onSubmit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();

        // If there is no token in the state yet, request the token and then abort this submit request
        // since it will be re-submitted when the recaptcha data is returned by the component.
        if (recaptchaEnabled && !token.current) {
            ref.current!.execute().catch(error => {
                console.error(error);

                setSubmitting(false);
                clearAndAddHttpError({ error });
            });

            return;
        }

        register({ ...values, recaptchaData: token.current })
            .then(() => {
                login({ ...values, recaptchaData: token.current }).then(() => {
                    // @ts-expect-error this is valid
                    window.location = '/';
                });
            })
            .catch(error => {
                console.error(error);

                token.current = '';
                if (ref.current) ref.current.reset();

                setSubmitting(false);
                clearAndAddHttpError({ error });
            });
    };

    return (
        <Formik
            onSubmit={onSubmit}
            initialValues={{ username: '', email: '', password: '', confirm_password: '', accept_privacy: false }}
            validationSchema={object().shape({
                username: string().required('A username must be provided.'),
                email: string().email().required('You must provide a valid email.'),
                password: string().required('Please enter your account password.'),
                confirm_password: string().required('Please enter the password confirmation.'),
                accept_privacy: boolean().oneOf([true], 'Du musst die Datenschutzerklärung akzeptieren.'),
            })}
        >
            {({ isSubmitting, setSubmitting, submitForm }) => (
                <LoginFormContainer title={String(t('auth.register.title'))}>
                    <Field
                        type={'text'}
                        label={String(t('auth.register.username'))}
                        icon={faIdBadge}
                        name={'username'}
                        placeholder={'user_account'}
                        disabled={isSubmitting}
                    />
                    <div css={tw`mt-6`}>
                        <Field
                            type={'text'}
                            label={String(t('auth.register.email'))}
                            icon={faAt}
                            name={'email'}
                            placeholder={'user@silast29.de'}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div css={tw`mt-6`}>
                        <Field
                            type={'password'}
                            label={String(t('auth.register.password'))}
                            icon={faKey}
                            name={'password'}
                            placeholder={'••••••••••••'}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div css={tw`mt-6`}>
                        <Field
                            type={'password'}
                            label={String(t('auth.register.confirm_password'))}
                            icon={faUnlockKeyhole}
                            name={'confirm_password'}
                            placeholder={'••••••••••••'}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div css={tw`mt-6`}>
                        <label css={tw`flex items-start gap-3 cursor-pointer text-sm text-neutral-200 select-none`}>
                            <FormikField
                                type={'checkbox'}
                                name={'accept_privacy'}
                                disabled={isSubmitting}
                                style={{ accentColor: '#22c55e' }}
                                css={tw`mt-0.5 w-5 h-5 flex-none cursor-pointer`}
                            />
                            <span>
                                {String(t('auth.register.accept_privacy'))}{' '}
                                <a
                                    href={'https://silast29.de/datenschutz'}
                                    target={'_blank'}
                                    rel={'noopener noreferrer'}
                                    css={tw`text-green-400 hover:text-green-200 underline`}
                                >
                                    {String(t('auth.register.privacy_link'))}
                                </a>{' '}
                                gelesen und stimme ihr zu.
                            </span>
                        </label>
                        <FormikField name={'accept_privacy'}>
                            {({ meta }: any) =>
                                meta.touched && meta.error ? (
                                    <p css={tw`mt-2 text-xs text-red-400`}>{meta.error}</p>
                                ) : null
                            }
                        </FormikField>
                    </div>
                    <div css={tw`mt-6`}>
                        <Button
                            type={'submit'}
                            loading={isSubmitting}
                            className={'w-full'}
                            size={Button.Sizes.Large}
                            disabled={isSubmitting}
                        >
                            {String(t('auth.register.button'))}
                        </Button>
                    </div>
                    {recaptchaEnabled && (
                        <Reaptcha
                            ref={ref}
                            size={'invisible'}
                            sitekey={siteKey || '_invalid_key'}
                            onVerify={response => {
                                token.current = response;
                                submitForm();
                            }}
                            onExpire={() => {
                                setSubmitting(false);
                                token.current = '';
                            }}
                        />
                    )}
                    <div css={tw`mt-6 text-center`}>
                        <Link
                            to={'/auth/login'}
                            css={tw`text-xs text-neutral-300 tracking-wide no-underline uppercase font-medium hover:text-neutral-600`}
                        >
                            {String(t('auth.register.return_to_login'))}
                        </Link>
                    </div>
                </LoginFormContainer>
            )}
        </Formik>
    );
}

export default RegisterContainer;
