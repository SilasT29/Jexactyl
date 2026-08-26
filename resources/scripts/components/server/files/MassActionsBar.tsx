import { useEffect, useState } from 'react';

import { compressFiles, deleteFiles } from '@/api/routes/server/files';
import { Button } from '@/elements/button';
import { Dialog } from '@/elements/dialog';
import Portal from '@/elements/Portal';
import SpinnerOverlay from '@/elements/SpinnerOverlay';
import RenameFileModal from '@server/files/RenameFileModal';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import FadeTransition from '@/elements/transitions/FadeTransition';
import { useTranslation } from 'react-i18next';

const MassActionsBar = () => {
    const { t } = useTranslation();
    const uuid = ServerContext.useStoreState(state => state.server.data!.uuid);

    const { mutate } = useFileManagerSwr();
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [showMove, setShowMove] = useState(false);
    const directory = ServerContext.useStoreState(state => state.files.directory);

    const selectedFiles = ServerContext.useStoreState(state => state.files.selectedFiles);
    const setSelectedFiles = ServerContext.useStoreActions(actions => actions.files.setSelectedFiles);

    useEffect(() => {
        if (!loading) setLoadingMessage('');
    }, [loading]);

    const onClickCompress = () => {
        setLoading(true);
        clearFlashes('files');
        setLoadingMessage(t('files.mass_actions.archiving'));

        compressFiles(uuid, directory, selectedFiles)
            .then(() => mutate())
            .then(() => setSelectedFiles([]))
            .catch(error => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setLoading(false));
    };

    const onClickConfirmDeletion = () => {
        setLoading(true);
        setShowConfirm(false);
        clearFlashes('files');
        setLoadingMessage(t('files.mass_actions.deleting'));

        deleteFiles(uuid, directory, selectedFiles)
            .then(async () => {
                await mutate(files => files!.filter(f => selectedFiles.indexOf(f.name) < 0), false);
                setSelectedFiles([]);
            })
            .catch(async error => {
                await mutate();
                clearAndAddHttpError({ key: 'files', error });
            })
            .then(() => setLoading(false));
    };

    return (
        <>
            <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-20 flex justify-center">
                <SpinnerOverlay visible={loading} size={'large'} fixed>
                    {loadingMessage}
                </SpinnerOverlay>
                <Dialog.Confirm
                    title={t('files.mass_actions.delete_title')}
                    open={showConfirm}
                    confirm={t('files.mass_actions.delete_confirm')}
                    onClose={() => setShowConfirm(false)}
                    onConfirmed={onClickConfirmDeletion}
                >
                    <p className="mb-2">
                        {t('files.mass_actions.delete_message', { count: selectedFiles.length })}
                    </p>
                    {selectedFiles.slice(0, 15).map(file => (
                        <li key={file}>{file}</li>
                    ))}
                    {selectedFiles.length > 15 && (
                        <li>{t('files.mass_actions.delete_others', { count: selectedFiles.length - 15 })}</li>
                    )}
                </Dialog.Confirm>
                {showMove && (
                    <RenameFileModal
                        files={selectedFiles}
                        visible
                        appear
                        useMoveTerminology
                        onDismissed={() => setShowMove(false)}
                    />
                )}
                <Portal>
                    <div className="pointer-events-none fixed bottom-0 z-50 mb-6 flex w-full justify-center">
                        <FadeTransition duration="duration-75" show={selectedFiles.length > 0} appear unmount>
                            <div className="pointer-events-auto flex items-center space-x-4 rounded bg-black/50 p-4">
                                <Button onClick={() => setShowMove(true)}>{t('files.mass_actions.move')}</Button>
                                <Button onClick={onClickCompress}>{t('files.mass_actions.archive')}</Button>
                                <Button.Danger variant={Button.Variants.Secondary} onClick={() => setShowConfirm(true)}>
                                    {t('files.mass_actions.delete')}
                                </Button.Danger>
                            </div>
                        </FadeTransition>
                    </div>
                </Portal>
            </div>
        </>
    );
};

export default MassActionsBar;
