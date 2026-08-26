import { useContext } from 'react';
import * as React from 'react';
import { DialogContext } from './';
import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';

export default ({ children }: { children: React.ReactNode }) => {
    const { setFooter } = useContext(DialogContext);

    useDeepCompareEffect(() => {
        setFooter(
            <div
                className={
                    'flex flex-col-reverse gap-2 rounded-b bg-zinc-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:gap-0 sm:space-x-3 sm:px-6'
                }
            >
                {children}
            </div>,
        );
    }, [children]);

    return null;
};
