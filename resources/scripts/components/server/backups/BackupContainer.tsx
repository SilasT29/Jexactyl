import { useContext, useEffect, useState } from 'react';
import Spinner from '@/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import Can from '@/elements/Can';
import CreateBackupButton from '@server/backups/CreateBackupButton';
import FlashMessageRender from '@/elements/FlashMessageRender';
import BackupRow from '@server/backups/BackupRow';
import tw from 'twin.macro';
import { getBackups, Context } from '@/api/routes/server/backups';
import { ServerContext } from '@/state/server';
import Pagination from '@/elements/Pagination';
import PageContentBlock from '@/elements/PageContentBlock';
import { useTranslation } from 'react-i18next';

const BackupContainer = () => {
    const { t } = useTranslation();
    const { page, setPage } = useContext(Context);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { data: backups, error, isValidating } = getBackups();

    const backupLimit = ServerContext.useStoreState(state => state.server.data!.featureLimits.backups);

    useEffect(() => {
        if (!error) {
            clearFlashes('backups');

            return;
        }

        clearAndAddHttpError({ error, key: 'backups' });
    }, [error]);

    if (!backups || (error && isValidating)) {
        return <Spinner size={'large'} centered />;
    }

    return (
        <PageContentBlock title={t('backups.title')} header description={t('backups.description')}>
            <FlashMessageRender byKey={'backups'} css={tw`mb-4`} />
            <Pagination data={backups} onPageSelect={setPage}>
                {({ items }) =>
                    !items.length ? (
                        // Don't show any error messages if the server has no backups and the user cannot
                        // create additional ones for the server.
                        !backupLimit ? null : (
                            <p css={tw`text-center text-sm text-neutral-300`}>
                                {page > 1 ? t('backups.no_more') : t('backups.empty')}
                            </p>
                        )
                    ) : (
                        items.map((backup, index) => (
                            <BackupRow key={backup.uuid} backup={backup} css={index > 0 ? tw`mt-2` : undefined} />
                        ))
                    )
                }
            </Pagination>
            {backupLimit === 0 && (
                <p css={tw`text-center text-sm text-neutral-300`}>{t('backups.limit_zero')}</p>
            )}
            <Can action={'backup.create'}>
                <div css={tw`mt-6 sm:flex items-center justify-end`}>
                    {backupLimit > 0 && backups.backupCount > 0 && (
                        <p css={tw`text-sm text-neutral-300 mb-4 sm:mr-6 sm:mb-0`}>
                            {t('backups.count_status', { count: backups.backupCount, limit: backupLimit })}
                        </p>
                    )}
                    {backupLimit > 0 && backupLimit > backups.backupCount && (
                        <CreateBackupButton css={tw`w-full sm:w-auto`} />
                    )}
                </div>
            </Can>
        </PageContentBlock>
    );
};

export default () => {
    const [page, setPage] = useState<number>(1);
    return (
        <Context.Provider value={{ page, setPage }}>
            <BackupContainer />
        </Context.Provider>
    );
};
