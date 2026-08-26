import { useEffect, useState } from 'react';
import Label from '@/elements/Label';
import { Link, useNavigate } from 'react-router-dom';
import ContentBox from '@/elements/ContentBox';
import { ServerContext } from '@/state/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowRight,
    faBoxOpen,
    faCalendarCheck,
    faCircleCheck,
    faHourglassHalf,
    faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import useFlash from '@/plugins/useFlash';
import SpinnerOverlay from '@/elements/SpinnerOverlay';
import { Alert } from '@/elements/alert';
import { useStoreState } from '@/state/hooks';
import PageContentBlock from '@/elements/PageContentBlock';
import { getProduct } from '@/api/routes/account/billing/products';
import { Product } from '@definitions/account/billing';
import { Button } from '@/elements/button';
import FlashMessageRender from '@/elements/FlashMessageRender';
import ServerPaymentButton from './ServerPaymentButton';
import OrdersContainer from '@/components/account/billing/orders/OrdersContainer';
import { processFreeCheckoutSession } from '@/api/routes/account/billing/orders/process';
import StatTile from '@/elements/billing/StatTile';
import Money from '@/elements/billing/Money';
import RadialProgress from '@/elements/billing/RadialProgress';
import { useTranslation } from 'react-i18next';

export function timeUntil(targetDate: Date | string) {
    const date = targetDate instanceof Date ? targetDate : new Date(targetDate);

    const now = new Date();
    const diffMs = date.getTime() - now.getTime();

    return {
        days: Math.floor(diffMs / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diffMs / (1000 * 60 * 60)) % 24),
    };
}

export default () => {
    const { t } = useTranslation();
    const [product, setProduct] = useState<Product>();
    const [loading, setLoading] = useState<boolean>(true);
    const [renewing, setRenewing] = useState<boolean>(false);

    const navigate = useNavigate();
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const settings = useStoreState(s => s.everest.data!.billing);
    const serverUuid = ServerContext.useStoreState(s => s.server.data!.uuid);
    const serverId = ServerContext.useStoreState(s => s.server.data!.internalId);
    const billingProductId = ServerContext.useStoreState(s => s.server.data!.billingProductId);
    const renewalDate = ServerContext.useStoreState(s => s.server.data!.renewalDate);

    useEffect(() => {
        clearFlashes();

        if (billingProductId) {
            getProduct(billingProductId)
                .then(data => setProduct(data))
                .then(() => setLoading(false))
                .catch(error => {
                    setLoading(false);
                    console.error(error);
                });
        }
    }, []);

    const handleFreeRenewal = () => {
        if (!product || !billingProductId) return;

        setRenewing(true);
        clearFlashes('server:billing');

        processFreeCheckoutSession(billingProductId, undefined, undefined, Number(serverId))
            .then(() => {
                navigate(`/server/${serverUuid}`);
            })
            .catch(error => {
                clearAndAddHttpError({ key: 'server:billing', error });
                setRenewing(false);
            });
    };

    const daysRemaining = renewalDate ? timeUntil(renewalDate).days : 0;

    return (
        <PageContentBlock
            title={t('billing.title')}
            header
            description={t('billing.description')}
        >
            {!product && !loading && (
                <Alert type={'warning'} className={'mb-6'}>
                    {t('billing.product_missing')}
                </Alert>
            )}
            {renewalDate && (
                <div className={'grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6'}>
                    <StatTile icon={faBoxOpen} label={t('billing.plan')} value={product ? product.name : t('billing.unknown')} />
                    <StatTile
                        icon={faCalendarCheck}
                        label={t('billing.cost')}
                        value={product ? <Money value={product.price} /> : '...'}
                        caption={t('billing.every_days', { days: settings.renewal.days })}
                    />
                    <StatTile icon={faHourglassHalf} label={t('billing.renews_in')} value={`${daysRemaining}d`} />
                    <StatTile
                        icon={daysRemaining > settings.renewal.threshold ? faCircleCheck : faTriangleExclamation}
                        label={t('billing.status')}
                        value={daysRemaining > settings.renewal.threshold ? t('billing.active') : t('billing.renewing_soon')}
                    />
                </div>
            )}
            <div className={'grid lg:grid-cols-3 gap-4'}>
                {!renewalDate ? (
                    <Alert type={'warning'}>{t('billing.no_renewal')}</Alert>
                ) : (
                    <ContentBox title={t('billing.summary')}>
                        <SpinnerOverlay visible={loading} />
                        <div className={'flex items-center gap-6'}>
                            <RadialProgress
                                value={((settings.renewal.days - daysRemaining) / settings.renewal.days) * 100}
                                label={
                                    <div className={'text-center'}>
                                        <p className={'text-lg font-bold leading-none'}>{daysRemaining}d</p>
                                        <p className={'text-2xs text-gray-400 mt-1'}>{t('billing.left')}</p>
                                    </div>
                                }
                            />
                            <div>
                                <Label>{t('billing.next_renewal')}</Label>
                                <p className={'text-gray-400 text-sm'}>
                                    {new Date(renewalDate).toLocaleDateString()}
                                    {' - '}
                                    {t('billing.every_days', {
                                        days: timeUntil(renewalDate).days,
                                        hours: timeUntil(renewalDate).hours,
                                    })}
                                </p>
                            </div>
                        </div>
                        <div className={'my-6'}>
                            <Label>{t('billing.your_package')}</Label>
                            <p className={'text-gray-400 text-sm'}>{product ? product.name : t('billing.unknown')}</p>
                            <p className={'text-gray-500 text-xs'}>{product && product.description}</p>
                        </div>
                        <div>
                            <Label>{t('billing.plan_cost')}</Label>
                            <div className={'flex justify-between'}>
                                <p className={'text-gray-400 text-sm'}>
                                    {product ? <Money value={product.price} /> : '...'} {t('billing.every_days', { days: settings.renewal.days })}
                                </p>
                                <Link to={'/account/billing/orders'} className={'text-green-400 text-xs'}>
                                    {t('billing.view_order')} <FontAwesomeIcon icon={faArrowRight} />
                                </Link>
                            </div>
                        </div>
                    </ContentBox>
                )}
                <div className={'lg:col-span-2'}>
                    <h2 className={'text-neutral-300 mb-4 px-4 text-2xl'}>{t('billing.related_orders')}</h2>
                    <OrdersContainer server_id={Number(serverId)} />
                </div>
                <ContentBox title={t('billing.renew_server')} className={'mt-6'}>
                    <FlashMessageRender byKey={'server:billing'} className={'mb-4'} />
                    {!product ? (
                        <Alert type={'danger'}>{t('billing.product_missing_renew')}</Alert>
                    ) : (
                        <>
                            {product.price === 0 ? (
                                <div>
                                    <p className={'mb-4'}>
                                        {t('billing.free_server', { days: daysRemaining })}
                                    </p>
                                    {!(daysRemaining - 7 <= 0) && (
                                        <p className={'mb-4 text-sm text-gray-400'}>
                                            {t('billing.renew_window', { days: daysRemaining - 7 })}
                                        </p>
                                    )}
                                    {daysRemaining - 7 <= 0 && (
                                        <Button
                                            onClick={handleFreeRenewal}
                                            disabled={renewing}
                                            size={Button.Sizes.Large}
                                        >
                                            {renewing ? t('billing.renewing') : t('billing.renew_button')}
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <ServerPaymentButton product={product} />
                            )}
                        </>
                    )}
                </ContentBox>
                {settings.allow_upgrades && (
                    <ContentBox className={'mt-6 lg:col-span-2'} title={t('billing.upgrade_package')}>
                        {t('billing.upgrade_description')}
                        <div className={'text-right'}>
                            <Link to={`/server/${serverUuid.slice(0, 8)}/billing/upgrade`}>
                                <Button className={'mt-8'} size={Button.Sizes.Large}>
                                    {t('billing.view_options')} <FontAwesomeIcon icon={faArrowRight} className={'ml-2'} />
                                </Button>
                            </Link>
                        </div>
                    </ContentBox>
                )}
            </div>
        </PageContentBlock>
    );
};
