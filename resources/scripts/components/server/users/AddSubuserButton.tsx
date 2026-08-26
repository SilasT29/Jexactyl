import { useState } from 'react';
import EditSubuserModal from '@server/users/EditSubuserModal';
import { Button } from '@/elements/button/index';
import { useTranslation } from 'react-i18next';

export default () => {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);

    return (
        <>
            <EditSubuserModal visible={visible} onModalDismissed={() => setVisible(false)} />
            <Button onClick={() => setVisible(true)}>{t('users.new')}</Button>
        </>
    );
};
