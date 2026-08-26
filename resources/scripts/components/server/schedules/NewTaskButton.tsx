import { useState } from 'react';
import { type Schedule } from '@definitions/server';
import TaskDetailsModal from '@server/schedules/TaskDetailsModal';
import { Button } from '@/elements/button/index';
import { useTranslation } from 'react-i18next';

interface Props {
    schedule: Schedule;
}

export default ({ schedule }: Props) => {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);

    return (
        <>
            <TaskDetailsModal schedule={schedule} visible={visible} onModalDismissed={() => setVisible(false)} />
            <Button onClick={() => setVisible(true)} className={'flex-1'}>
                {t('schedules.task.new')}
            </Button>
        </>
    );
};
