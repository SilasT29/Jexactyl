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
                'block md:hidden w-full fixed bottom-0 z-50 rounded-t-2xl bg-black/80 backdrop-blur-lg border-t border-white/10 shadow-[0_-8px_24px_rgba(0,0,0,0.4)]'
            }
            style={{ height: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
        >
            <div
                className={'flex h-16 overflow-x-auto overscroll-x-contain scrollbar-none'}
                style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none' }}
            >
                <div className={'flex items-stretch w-full min-w-full justify-around gap-1 px-2'}>{children}</div>
            </div>
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
                    'h-full min-w-[52px] flex flex-col items-center justify-center font-semibold transition-all duration-200 active:scale-95 px-2 flex-shrink-0 rounded-lg',
                    isActive && 'scale-105',
                )
            }
        >
            {({ isActive }) => (
                <>
                    {Icon && (
                        <Icon
                            className={'w-5 h-5 mb-0.5 transition-all duration-200'}
                            style={{ color: isActive ? colors.primary : 'rgba(255,255,255,0.55)' }}
                        />
                    )}
                    <span
                        className={'text-[10px] leading-none'}
                        style={{ color: isActive ? colors.primary : 'rgba(255,255,255,0.55)' }}
                    >
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
                className={'active:scale-95 transition-transform duration-150 flex-shrink-0 min-w-[52px]'}
            >
                <div className={'h-full flex flex-col items-center justify-center font-semibold my-auto px-2 rounded-lg'}>
                    <HomeIcon className={'w-5 h-5 mb-0.5 brightness-150'} style={{ color: colors.primary }} />
                    <span className={'text-[10px] leading-none'} style={{ color: colors.primary }}>
                        Home
                    </span>
                </div>
            </NavLink>
        </>
    );
};

export default withSubComponents(MobileSidebar, { Link, Home });
