import { type Schedule } from '@definitions/server';
import { useStoreState } from '@/state/hooks';
import classNames from 'classnames';

interface Props {
    cron: Schedule['cron'];
    className?: string;
}

const ScheduleCronRow = ({ cron, className }: Props) => {
    const { colors } = useStoreState(state => state.theme.data!);

    return (
        <div className={classNames('flex gap-2 sm:gap-4 overflow-x-auto', className)} style={{ backgroundColor: colors.secondary }}>
            <div className={'w-1/5 min-w-fit text-center sm:w-auto'}>
                <p className={'font-medium'}>{cron.minute}</p>
                <p className={'text-2xs uppercase text-neutral-500 whitespace-nowrap'}>Minute</p>
            </div>
            <div className={'w-1/5 min-w-fit text-center sm:w-auto'}>
                <p className={'font-medium'}>{cron.hour}</p>
                <p className={'text-2xs uppercase text-neutral-500 whitespace-nowrap'}>Hour</p>
            </div>
            <div className={'w-1/5 min-w-fit text-center sm:w-auto'}>
                <p className={'font-medium'}>{cron.dayOfMonth}</p>
                <p className={'text-2xs uppercase text-neutral-500 whitespace-nowrap'}>Day (Month)</p>
            </div>
            <div className={'w-1/5 min-w-fit text-center sm:w-auto'}>
                <p className={'font-medium'}>{cron.month}</p>
                <p className={'text-2xs uppercase text-neutral-500 whitespace-nowrap'}>Month</p>
            </div>
            <div className={'w-1/5 min-w-fit text-center sm:w-auto'}>
                <p className={'font-medium'}>{cron.dayOfWeek}</p>
                <p className={'text-2xs uppercase text-neutral-500 whitespace-nowrap'}>Day (Week)</p>
            </div>
        </div>
    );
};

export default ScheduleCronRow;
