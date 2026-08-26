import { memo, useState } from 'react';
import tw from 'twin.macro';
import { ServerContext } from '@/state/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSortAmountDown, faSortAmountUp, faSearch, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import type { SortField } from '@/state/server/files';
import { Button } from '@/elements/button/index';
import { useStoreState } from '@/state/hooks';
import Tooltip from '@/elements/tooltip/Tooltip';
import Input from '@/elements/Input';
import { useTranslation } from 'react-i18next';

const FileSortControls = () => {
    const { t } = useTranslation();
    const sortOptions: Array<{ value: SortField; label: string; tooltip: string }> = [
        { value: 'name', label: t('files.sort_options.name'), tooltip: t('files.sort_options.name_tooltip') },
        { value: 'modified', label: t('files.sort_options.modified'), tooltip: t('files.sort_options.modified_tooltip') },
        { value: 'size', label: t('files.sort_options.size'), tooltip: t('files.sort_options.size_tooltip') },
        { value: 'type', label: t('files.sort_options.type'), tooltip: t('files.sort_options.type_tooltip') },
    ];
    const { colors } = useStoreState(state => state.theme.data!);
    const sortField = ServerContext.useStoreState(state => state.files.sortField);
    const sortDirection = ServerContext.useStoreState(state => state.files.sortDirection);
    const searchTerm = ServerContext.useStoreState(state => state.files.searchTerm);
    const setSortField = ServerContext.useStoreActions(actions => actions.files.setSortField);
    const setSortDirection = ServerContext.useStoreActions(actions => actions.files.setSortDirection);
    const setSearchTerm = ServerContext.useStoreActions(actions => actions.files.setSearchTerm);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const handleSortFieldChange = (field: SortField) => {
        if (field === sortField) {
            // Toggle direction if clicking the same field
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new field with default ascending direction
            setSortField(field);
            setSortDirection('asc');
        }
        setDropdownOpen(false);
    };

    const activeLabel = sortOptions.find(option => option.value === sortField)?.label || t('files.sort');

    return (
        <div css={tw`flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4`}>
            {/* Desktop / tablet: horizontal scrollable chip row */}
            <div css={tw`hidden sm:flex flex-1 justify-center items-center gap-2 min-w-0`}>
                <span css={tw`text-sm text-neutral-400 font-medium whitespace-nowrap`}>{t('files.sort_label')}</span>
                <div css={tw`flex items-center gap-2 overflow-x-auto pb-1`}>
                    {sortOptions.map(option => (
                        <Tooltip key={option.value} content={option.tooltip} placement="top">
                            <button
                                type="button"
                                onClick={() => handleSortFieldChange(option.value)}
                                css={tw`px-3 py-1 text-sm rounded-full transition-all duration-150 whitespace-nowrap flex-none inline-flex items-center border`}
                                style={
                                    sortField === option.value
                                        ? { backgroundColor: colors.primary, borderColor: 'transparent' }
                                        : { backgroundColor: colors.secondary, borderColor: 'transparent' }
                                }
                            >
                                {option.label}
                                {sortField === option.value && (
                                    <FontAwesomeIcon
                                        icon={sortDirection === 'asc' ? faSortAmountUp : faSortAmountDown}
                                        css={tw`ml-1.5`}
                                        size="xs"
                                    />
                                )}
                            </button>
                        </Tooltip>
                    ))}
                </div>
            </div>
            {/* Mobile: compact "Sort" dropdown, centered */}
            <div css={tw`relative sm:hidden flex justify-center`}>
                <Button
                    size={Button.Sizes.Small}
                    variant={Button.Variants.Secondary}
                    onClick={() => setDropdownOpen(open => !open)}
                    className={'inline-flex items-center gap-2'}
                >
                    {t('files.sort_label')} {activeLabel}
                    <FontAwesomeIcon icon={faChevronDown} size="xs" />
                </Button>
                {dropdownOpen && (
                    <>
                        <div css={tw`fixed inset-0 z-40`} onClick={() => setDropdownOpen(false)} aria-hidden="true" />
                        <div
                            css={tw`absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 min-w-[10rem] rounded-lg shadow-lg border border-neutral-700 overflow-hidden`}
                            style={{ backgroundColor: colors.secondary }}
                        >
                            {sortOptions.map(option => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSortFieldChange(option.value)}
                                    css={tw`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-white/5`}
                                >
                                    <span>{option.label}</span>
                                    {sortField === option.value && (
                                        <FontAwesomeIcon
                                            icon={sortDirection === 'asc' ? faSortAmountUp : faSortAmountDown}
                                            size="xs"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
            <div css={tw`flex items-center gap-2 flex-1 sm:max-w-xs`}>
                <div css={tw`relative flex-1`}>
                    <FontAwesomeIcon
                        icon={faSearch}
                        css={tw`absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 pointer-events-none`}
                        size="sm"
                    />
                    <Input
                        type="text"
                        placeholder={t('files.search_placeholder')}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '2.5rem', fontSize: '0.875rem' }}
                        aria-label="Search files by name"
                        role="searchbox"
                    />
                </div>
            </div>
        </div>
    );
};

export default memo(FileSortControls);
