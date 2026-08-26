import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import FlashMessageRender from '@/elements/FlashMessageRender';
import PageContentBlock from '@/elements/PageContentBlock';
import Spinner from '@/elements/Spinner';
import { useStoreState } from '@/state/hooks';

export default () => {
    const navigate = useNavigate();
    const { colors } = useStoreState(state => state.theme.data!);

    useEffect(() => {
        // The manual order flow does not redirect through a payment processing page.
        // If a user lands here, send them back to the order list.
        navigate('/account/billing/orders', { replace: true });
    }, []);

    return (
        <PageContentBlock>
            <div className={'flex justify-center'}>
                <div
                    className={'w-full sm:w-3/4 md:w-1/2 p-12 rounded-lg shadow-lg text-center relative'}
                    style={{ backgroundColor: colors.secondary }}
                >
                    <FlashMessageRender byKey={'billing:process'} className={'mb-6'} />
                    <h2 className={'text-white font-bold text-4xl'}>
                        Processing Order <Spinner centered />
                    </h2>
                    <p className={'text-sm text-neutral-200 mt-2'}>
                        Redirecting you to your orders…
                    </p>
                </div>
            </div>
        </PageContentBlock>
    );
};
