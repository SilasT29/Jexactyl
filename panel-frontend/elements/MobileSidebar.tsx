import { ElementType, ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useStoreState } from '@/state/hooks';
import { HomeIcon } from '@heroicons/react/outline';
import { withSubComponents } from '@/lib/helpers';
import classNames from 'classnames';

const MobileSidebar = ({ children }: { children: ReactNode[] }) => {
    return (
        <div
            className={
                'block md:hidden w-full fixed bottom-0 z-50 rounded-t-2xl bg-black/70 backdrop-blur-lg border-t border-white/10 shadow-[0_-8px_24px_rgba(0,0,0,0.3)]'
            }
            style={{ height: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
        >
            <div className={'flex h-16 px-2 space-x-1 overflow-x-auto'}>{children}</div>
        </div>
    );
};

const Link = ({
    icon: Icon,
    text,
    linkTo,
    end,
}: {
    icon: ElementType;
    text?: string;
    linkTo: string;
    end?: boolean;
}) => {
    const { colors } = useStoreState(s => s.theme.data!);

    return (
        <NavLink
            to={linkTo}
            end={end}
            className={({ isActive }) =>
                classNames(
                    'h-full min-w-[44px] flex flex-col items-center justify-center font-semibold transition-all duration-300 active:scale-90 px-3 flex-shrink-0',
                    isActive && 'scale-105',
                )
            }
        >
            {({ isActive }) => (
                <>
                    {Icon && (
                        <Icon
                            className={'w-5 h-5 mb-0.5 transition-transform duration-300'}
                            style={{ color: isActive ? colors.primary : undefined }}
                        />
                    )}
                    <span className={'text-[11px] leading-none'} style={{ color: isActive ? colors.primary : undefined }}>
                        {text}
                    </span>
                </>
            )}
        </NavLink>
    );
};

const Home = () => {
    const { colors } = useStoreState(s => s.theme.data!);
    return (
        <>
            <NavLink
                to={'/'}
                className={'active:scale-90 transition-transform duration-200 flex-shrink-0 min-w-[44px]'}
            >
                <div className={'h-full flex items-center justify-center font-semibold my-auto px-3'}>
                    <HomeIcon className={'w-5 h-5 brightness-150'} style={{ color: colors.primary }} />
                </div>
            </NavLink>
            <div className={'mx-1 my-auto flex-shrink-0'}>&bull;</div>
        </>
    );
};

export default withSubComponents(MobileSidebar, { Link, Home });
