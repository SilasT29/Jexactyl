import { useEffect, useState } from 'react';
import * as React from 'react';
import { Button } from '@/elements/button/index';
import Can from '@/elements/Can';
import { ServerContext } from '@/state/server';
import { PowerAction } from '@server/console/ServerConsoleContainer';
import { Dialog } from '@/elements/dialog';
import { PlayIcon, StopIcon, BanIcon, RefreshIcon } from '@heroicons/react/outline';
import { useTranslation } from 'react-i18next';
import SaveButton from '@server/console/SaveButton';

interface PowerButtonProps {
    className?: string;
}

export default ({ className }: PowerButtonProps) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const status = ServerContext.useStoreState(state => state.status.value);
    const instance = ServerContext.useStoreState(state => state.socket.instance);

    const killable = status === 'stopping';
    const onButtonClick = (
        action: PowerAction | 'kill-confirmed',
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    ): void => {
        e.preventDefault();
        if (action === 'kill') {
            return setOpen(true);
        }

        if (instance) {
            setOpen(false);
            instance.send('set state', action === 'kill-confirmed' ? 'kill' : action);
        }
    };

    useEffect(() => {
        if (status === 'offline') {
            setOpen(false);
        }
    }, [status]);

    return (
        <div className={className}>
            <Dialog.Confirm
                open={open}
                hideCloseIcon
                onClose={() => setOpen(false)}
                title={t('console.kill_dialog.title')}
                confirm={t('console.kill_dialog.confirm')}
                onConfirmed={onButtonClick.bind(this, 'kill-confirmed')}
            >
                {t('console.kill_dialog.message')}
            </Dialog.Confirm>
            <SaveButton />
            <Can action={'control.start'}>
                <Button.Success disabled={status !== 'offline'} onClick={onButtonClick.bind(this, 'start')}>
                    <PlayIcon className={'w-5 mr-1'} /> {t('console.power_buttons.start')}
                </Button.Success>
            </Can>
            <Can action={'control.restart'}>
                <Button.Dark disabled={!status} onClick={onButtonClick.bind(this, 'restart')}>
                    <RefreshIcon className={'w-5 mr-1'} /> {t('console.power_buttons.restart')}
                </Button.Dark>
            </Can>
            <Can action={'control.stop'}>
                <Button.Danger
                    disabled={status === 'offline'}
                    onClick={onButtonClick.bind(this, killable ? 'kill' : 'stop')}
                >
                    {killable ? (
                        <>
                            <BanIcon className={'w-5 mr-1'} /> {t('console.power_buttons.kill')}
                        </>
                    ) : (
                        <>
                            <StopIcon className={'w-5 mr-1'} /> {t('console.power_buttons.stop')}
                        </>
                    )}
                </Button.Danger>
            </Can>
        </div>
    );
};
