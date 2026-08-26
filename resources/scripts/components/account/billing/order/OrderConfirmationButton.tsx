import { FormEvent, useState } from 'react';
import useFlash from '@/plugins/useFlash';
import { Button } from '@/elements/button';
import FlashMessageRender from '@/elements/FlashMessageRender';
import SpinnerOverlay from '@/elements/SpinnerOverlay';
import { Product } from '@definitions/account/billing';
import { createOrderTicket } from '@/api/routes/account/billing/orders/process';
import { Alert } from '@/elements/alert';
import { useNavigate } from 'react-router-dom';

interface Props {
    node: number;
    product: Product;
    vars: Map<string, string>;
    discount_code?: string | undefined;
    egg?: number;
}

export interface BillingServerVariables {
    key: string;
    value: string;
}

export default (data: Props) => {
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const navigate = useNavigate();
    const eggMissing = data.product.eggId === null && !data.egg;

    const handleSubmit = async (event: FormEvent) => {
        clearFlashes();
        setLoading(true);
        event.preventDefault();

        const variables: BillingServerVariables[] = Array.from(data.vars, ([key, value]) => ({ key, value }));

        createOrderTicket(data.product.id, data.node, variables, data.discount_code, data.egg)
            .then(() => setSubmitted(true))
            .catch(error => clearAndAddHttpError({ key: 'account:billing:order', error }))
            .finally(() => setLoading(false));
    };

    if (submitted) {
        return (
            <div className={'text-right'}>
                <Alert type={'success'} className={'mb-2'}>
                    Your order request has been submitted. Our team will review it and contact you for payment.
                </Alert>
                <Button onClick={() => navigate('/account/tickets')}>
                    View Tickets
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            <SpinnerOverlay visible={loading} />
            <FlashMessageRender byKey={'account:billing:order'} className={'mb-4'} />
            {isNaN(data.node) ? (
                <Alert type={'warning'}>A valid node must be selected to continue with your order.</Alert>
            ) : eggMissing ? (
                <Alert type={'warning'}>An egg must be selected to continue with your order.</Alert>
            ) : (
                <div className={'text-right'}>
                    <Button disabled={isNaN(data.node) || eggMissing} size={Button.Sizes.Large}>
                        Submit Order
                    </Button>
                </div>
            )}
        </form>
    );
};
