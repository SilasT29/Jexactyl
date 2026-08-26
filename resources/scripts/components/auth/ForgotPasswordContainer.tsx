import { useStoreState } from 'easy-peasy';
import type { FormikHelpers } from 'formik';
import { Formik } from 'formik';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Reaptcha from 'reaptcha';
import tw from 'twin.macro';
import { object, string } from 'yup';
import { requestPasswordReset } from '@/api/routes/auth/password-reset';
import { httpErrorToHuman } from '@/api/http';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import { Button } from '@/elements/button';
import Field from '@/elements/Field';
import useFlash from '@/plugins/useFlash';

interface Values {
    email: string;
    code: string;
    password: string;
    password_confirm: string;
}

function ForgotPasswordContainer() {
    const { t } = useTranslation();
    const ref = useRef<Reaptcha>(null);
    const token = useRef('');

    const { clearFlashes, addFlash } = useFlash();
    const { enabled: recaptchaEnabled, siteKey } = useStoreState(state => state.settings.data!.recaptcha);

    useEffect(() => {
        clearFlashes();
    }, []);

    const handleSubmission = (
        { email, code, password, password_confirm }: Values,
        { setSubmitting, resetForm }: FormikHelpers<Values>,
    ) => {
        clearFlashes();

        // If there is no token in the state yet, request the token and then abort this submit request
        // since it will be re-submitted when the recaptcha data is returned by the component.
        if (recaptchaEnabled && !token.current) {
            ref.current!.execute().catch(error => {
                console.error(error);

                setSubmitting(false);
                addFlash({ type: 'error', title: 'Error', message: httpErrorToHuman(error) });
            });

            return;
        }

        requestPasswordReset(email, code, password, password_confirm, token.current)
            .then(response => {
                resetForm();
                addFlash({ type: 'success', title: 'Success', message: response });
            })
            .catch(error => {
                console.error(error);
                addFlash({ type: 'error', title: 'Error', message: httpErrorToHuman(error) });
            })
            .then(() => {
                token.current = '';
                if (ref.current !== null) {
                    void ref.current.reset();
                }

                setSubmitting(false);
            });
    };

    return (
        <Formik
            onSubmit={handleSubmission}
            initialValues={{ email: '', code: '', password: '', password_confirm: '' }}
            validationSchema={object().shape({
                email: string()
                    .email('A valid email address must be provided to continue.')
                    .required('A valid email address must be provided to continue.'),
                code: string().required('You must enter your account recovery code to continue.'),
                password: string().min(8).required(),
                password_confirm: string().min(8).required(),
            })}
        >
            {({ isSubmitting, setSubmitting, submitForm }) => (
                <LoginFormContainer title={String(t('auth.forgot_password.title'))} css={tw`w-full flex`}>
                    <Field
                        label={String(t('auth.forgot_password.email'))}
                        description={String(t('auth.forgot_password.email_description'))}
                        name={'email'}
                        type={'email'}
                    />
                    <div className={'mt-6'}>
                        <Field
                            label={String(t('auth.forgot_password.recovery_code'))}
                            description={String(t('auth.forgot_password.recovery_code_description'))}
                            name={'code'}
                            type={'text'}
                        />
                    </div>
                    <div className={'my-6'}>
                        <Field
                            label={String(t('auth.forgot_password.new_password'))}
                            description={String(t('auth.forgot_password.new_password_description'))}
                            name={'password'}
                            type={'password'}
                        />
                    </div>
                    <Field
                        label={String(t('auth.forgot_password.confirm_password'))}
                        description={String(t('auth.forgot_password.confirm_password_description'))}
                        name={'password_confirm'}
                        type={'password'}
                    />
                    <div css={tw`mt-6`}>
                        <Button type={'submit'} className={'w-full'} size={Button.Sizes.Large} disabled={isSubmitting}>
                            {String(t('auth.forgot_password.button'))}
                        </Button>
                    </div>
                    {recaptchaEnabled && (
                        <Reaptcha
                            ref={ref}
                            size={'invisible'}
                            sitekey={siteKey || '_invalid_key'}
                            onVerify={response => {
                                token.current = response;
                                void submitForm();
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
                            {String(t('auth.forgot_password.return_to_login'))}
                        </Link>
                    </div>
                </LoginFormContainer>
            )}
        </Formik>
    );
}

export default ForgotPasswordContainer;
