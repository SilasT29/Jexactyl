import { Field, Form, Formik, FormikHelpers } from 'formik';
import { object, string } from 'yup';
import { useTranslation } from 'react-i18next';
import FormikFieldWrapper from '@/elements/FormikFieldWrapper';
import SpinnerOverlay from '@/elements/SpinnerOverlay';
import tw from 'twin.macro';
import { Button } from '@/elements/button';
import Input, { Textarea } from '@/elements/Input';
import styled from 'styled-components';
import { useFlashKey } from '@/plugins/useFlash';
import { createTicket } from '@/api/routes/account/tickets';
import FlashMessageRender from '@/elements/FlashMessageRender';
import { useNavigate } from 'react-router-dom';

interface Values {
    title: string;
    message: string;
}

const CustomTextarea = styled(Textarea)`
    ${tw`h-32`}
`;

export default () => {
    const { clearAndAddHttpError } = useFlashKey('account:tickets');
    const navigate = useNavigate();
    const { t } = useTranslation();

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearAndAddHttpError();

        createTicket(values.title, values.message)
            .then(ticket => {
                navigate(`/account/tickets/${ticket.id}`);
            })
            .catch(error => clearAndAddHttpError(error))
            .then(() => setSubmitting(false));
    };

    return (
        <>
            <Formik
                onSubmit={submit}
                initialValues={{ title: '', message: '' }}
                validationSchema={object().shape({
                    title: string().required(),
                    message: string().required().min(3).max(300),
                })}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <FlashMessageRender byKey={'account:tickets'} css={tw`mb-4`} />
                        <SpinnerOverlay visible={isSubmitting} />
                        <FormikFieldWrapper
                            name={'title'}
                            css={tw`mb-6`}
                            label={String(t('tickets.form.ticket_name'))}
                            description={String(t('tickets.form.ticket_name_description'))}
                        >
                            <Field name={'title'} as={Input} css={tw`w-full`} />
                        </FormikFieldWrapper>
                        <FormikFieldWrapper
                            label={String(t('tickets.form.message'))}
                            name={'message'}
                            description={String(t('tickets.form.message_description'))}
                        >
                            <Field name={'message'} as={CustomTextarea} css={tw`w-full`} />
                        </FormikFieldWrapper>
                        <div css={tw`flex justify-end mt-6`}>
                            <Button>{String(t('buttons.save'))}</Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </>
    );
};
