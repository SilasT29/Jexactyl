import useFlash from '@/plugins/useFlash';
import { Button } from '@/elements/button';
import { FormEvent, useState } from 'react';
import SpinnerOverlay from '@/elements/SpinnerOverlay';
import FlashMessageRender from '@/elements/FlashMessageRender';
import { createOrderTicket } from '@/api/routes/account/billing/orders/process';
import { Product } from '@/api/definitions/account/billing';
import { ServerContext } from '@/state/server';
import { useStoreState } from '@/state/hooks';
import { useNavigate } from 'react-router-dom';

export default ({ product }: { product: Product }) => {
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const navigate = useNavigate();

    const server = ServerContext.useStoreState(state => state.server.data!);
    const [loading, setLoading] = useState<boolean>(false);
    const [submitted, setSubmitted] = useState<boolean>(false);

    const handleSubmit = async (event: FormEvent) => {
        clearFlashes('server:billing:payment');
        setLoading(true);
        event.preventDefault();

        createOrderTicket(product.id, undefined, undefined, undefined, undefined, Number(server.internalId))
            .then(() => setSubmitted(true))
            .catch(error => clearAndAddHttpError({ key: 'server:billing:payment', error }))
            .finally(() => setLoading(false));
    };

    const settings = useStoreState(s => s.everest.data!.billing);
    const days = settings.renewal.days;
    const updatedRenewalDate = new Date(server.renewalDate!.getTime() + days * 24 * 60 * 60 * 1000);

    if (submitted) {
        return (
            <div>
                <p className={'mb-4 text-green-400'}>
                    Your renewal request has been submitted. Our team will review it and contact you for payment.
                </p>
                <Button onClick={() => navigate('/account/tickets')}>
                    View Tickets
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            <SpinnerOverlay visible={loading} />
            <FlashMessageRender byKey={'server:billing:payment'} className={'mb-4'} />
            <p className={'mb-4'}>
                Renewing your server now will add another {days} days to your server, making your renewal date{' '}
                {new Date(updatedRenewalDate).toLocaleDateString()} (+{days} days).
            </p>
            <div className={'text-right'}>
                <Button className={'mt-4'} size={Button.Sizes.Large}>
                    Submit Renewal Request
                </Button>
            </div>
        </form>
    );
};
