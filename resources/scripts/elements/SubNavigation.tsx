import { useStoreState } from '@/state/hooks';
import classNames from 'classnames';
import type { ComponentType, ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import tw, { styled } from 'twin.macro';
import { SiteTheme } from '@/state/theme';

const StyledSubNavigation = styled.div<{ $theme: SiteTheme }>`
    ${tw`flex flex-row flex-wrap md:flex-nowrap items-center justify-center md:justify-start gap-2 md:gap-0 flex-shrink-0 min-h-[3rem] mb-4 md:border-b border-neutral-700 overflow-hidden md:overflow-x-auto`};

    & > a {
        ${tw`flex flex-row items-center justify-center md:justify-start flex-none w-auto min-h-[44px] md:h-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-base text-center md:text-left whitespace-normal md:whitespace-nowrap rounded-full md:rounded-none border border-transparent bg-neutral-800/60 md:bg-transparent`};

        & > svg {
            ${tw`w-4 h-4 md:w-6 md:h-6 mr-1 md:mb-0 md:mr-2`};
        }

        &:active,
        &.active {
            color: ${({ $theme }) => $theme.colors.primary};
            border-color: ${({ $theme }) => $theme.colors.primary};
            background-color: rgba(255, 255, 255, 0.08);
        }
    }
`;

export const SubNavigation = ({ children }: { children: ReactNode }) => {
    const theme = useStoreState(state => state.theme.data!);
    return <StyledSubNavigation $theme={theme}>{children}</StyledSubNavigation>;
};

interface Props {
    to: string;
    name: string;
    base?: boolean;
    disabled?: boolean;
}

interface PropsWithIcon extends Props {
    icon: ComponentType;
    children?: never;
}

interface PropsWithoutIcon extends Props {
    icon?: never;
    children: ReactNode;
}

export const SubNavigationLink = ({
    base,
    to,
    name,
    icon: IconComponent,
    children,
    disabled,
}: PropsWithIcon | PropsWithoutIcon) => (
    <NavLink to={to} end={base} className={classNames(disabled ? 'text-gray-500' : 'text-neutral-400 md:text-neutral-300')}>
        {IconComponent ? <IconComponent /> : children}
        {name}
    </NavLink>
);
