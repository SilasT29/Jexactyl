import styled from 'styled-components';
import { breakpoint } from '@/assets/theme';
import tw from 'twin.macro';

const ContentContainer = styled.div`
    ${tw`w-full max-w-full overflow-x-hidden px-4 sm:px-0`};

    ${breakpoint('xl')`
        ${tw`px-12`};
    `};
`;
ContentContainer.displayName = 'ContentContainer';

export default ContentContainer;
