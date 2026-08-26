import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import tw from 'twin.macro';
import { useFlashKey } from '@/plugins/useFlash';
import { useTickets } from '@/api/routes/account/tickets';
import ContentBox from '@/elements/ContentBox';
import FlashMessageRender from '@/elements/FlashMessageRender';
import PageContentBlock from '@/elements/PageContentBlock';
import CreateTicketForm from '@account/tickets/CreateTicketForm';
import SpinnerOverlay from '@/elements/SpinnerOverlay';
import { format, formatDistanceToNow } from 'date-fns';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import { useStoreState } from '@/state/hooks';

export const statusToColor = (status: string): string => {
    switch (status) {
        case 'in-progress':
            return 'bg-yellow-200 text-yellow-800';
        case 'unresolved':
            return 'bg-red-200 text-red-800';
        case 'resolved':
            return 'bg-green-200 text-green-800';
        default:
            return 'bg-gray-400 text-gray-800';
    }
};

export default () => {
    const { clearAndAddHttpError } = useFlashKey('account');
    const { colors } = useStoreState(state => state.theme.data!);
    const { t } = useTranslation();
    const {
        data: tickets,
        isValidating,
        error,
    } = useTickets({
        revalidateOnMount: true,
        revalidateOnFocus: false,
    });

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error]);

    return (
        <PageContentBlock title={String(t('tickets.support_tickets'))}>
            <FlashMessageRender byKey={'account:tickets'} />
            <div css={tw`text-3xl lg:text-5xl font-bold mt-8 mb-12`}>
                {String(t('tickets.your_tickets'))}
                <p css={tw`text-gray-400 font-normal text-sm mt-1`}>{String(t('tickets.create_description'))}</p>
            </div>
            <div css={tw`grid lg:grid-cols-3 gap-4 pb-20`}>
                <div css={tw`lg:col-span-2`}>
                    <ContentBox title={String(t('tickets.support_tickets'))}>
                        <SpinnerOverlay visible={!tickets && isValidating} />
                        {!tickets || !tickets.length ? (
                            <p css={tw`text-center text-sm`}>
                                {!tickets ? String(t('common.loading')) : String(t('tickets.no_tickets'))}
                            </p>
                        ) : (
                            tickets.map((ticket, index) => (
                                <Link to={`/account/tickets/${ticket.id}`} key={ticket.id}>
                                    <div
                                        style={{ backgroundColor: colors.headers }}
                                        css={[
                                            tw`w-full min-w-0 rounded-lg`,
                                            tw`flex flex-col md:flex-row gap-2 md:gap-0`,
                                            tw`px-4 py-4`,
                                            index > 0 ? tw`mt-4` : tw`mt-0`,
                                        ]}
                                    >
                                        <div css={tw`flex items-center truncate w-full md:flex-1 min-w-0`}>
                                            <p css={tw`mr-4 text-xl font-bold`}>#{ticket.id}</p>
                                            <div css={tw`flex flex-col truncate min-w-0`}>
                                                <div css={tw`flex flex-col sm:flex-row sm:items-center mb-1`}>
                                                    <p css={tw`break-words truncate text-lg`}>{ticket.title}</p>
                                                    <span
                                                        className={classNames(
                                                            statusToColor(ticket.status),
                                                            'capitalize px-2 mt-1 sm:mt-0 sm:ml-4 inline-flex text-xs leading-5 font-medium rounded-full self-start sm:self-auto',
                                                        )}
                                                    >
                                                        {ticket.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {ticket.createdAt && (
                                            <div css={tw`flex-none md:w-48 mt-2 md:mt-0 md:ml-8 md:text-center`}>
                                                <p css={tw`text-sm`}>{format(ticket.createdAt, 'MMMM do, yyyy')}</p>
                                                <p css={tw`text-2xs text-gray-300 uppercase mt-1`}>
                                                    {String(t('tickets.created'))}{' '}
                                                    {formatDistanceToNow(ticket.createdAt, {
                                                        includeSeconds: true,
                                                        addSuffix: true,
                                                    })}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))
                        )}
                    </ContentBox>
                </div>
                <ContentBox title={String(t('tickets.create_ticket'))}>
                    <CreateTicketForm />
                </ContentBox>
            </div>
        </PageContentBlock>
    );
};
