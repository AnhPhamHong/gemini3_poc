import { FunnelIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';

interface WorkflowFiltersProps {
    sortBy: string;
    sortDescending: boolean;
    filterByState: string;
    onSortChange: (field: string) => void;
    onOrderChange: (descending: boolean) => void;
    onFilterChange: (state: string) => void;
}

const SORT_OPTIONS = [
    { label: 'Date Created', value: 'CreatedAt' },
    { label: 'Last Updated', value: 'UpdatedAt' },
    { label: 'Topic', value: 'Topic' },
];

const STATE_OPTIONS = [
    { label: 'All States', value: '' },
    { label: 'Idle', value: 'Idle' },
    { label: 'Researching', value: 'Researching' },
    { label: 'Outlining', value: 'Outlining' },
    { label: 'Waiting Approval', value: 'WaitingApproval' },
    { label: 'Drafting', value: 'Drafting' },
    { label: 'Editing', value: 'Editing' },
    { label: 'Optimizing', value: 'Optimizing' },
    { label: 'Final', value: 'Final' },
    { label: 'Failed', value: 'Failed' },
];

export default function WorkflowFilters({
    sortBy,
    sortDescending,
    filterByState,
    onSortChange,
    onOrderChange,
    onFilterChange,
}: WorkflowFiltersProps) {
    return (
        <div className="bg-white p-4 rounded-md shadow-sm mb-6 border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">

                {/* Filter Section */}
                <div className="flex items-center space-x-2">
                    <FunnelIcon className="h-5 w-5 text-gray-400" />
                    <label htmlFor="state-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        Filter by:
                    </label>
                    <select
                        id="state-filter"
                        value={filterByState}
                        onChange={(e) => onFilterChange(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    >
                        {STATE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Sort Section */}
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <ArrowsUpDownIcon className="h-5 w-5 text-gray-400" />
                        <label htmlFor="sort-by" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                            Sort by:
                        </label>
                        <select
                            id="sort-by"
                            value={sortBy}
                            onChange={(e) => onSortChange(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                        >
                            {SORT_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={() => onOrderChange(!sortDescending)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                        {sortDescending ? 'Newest First' : 'Oldest First'}
                    </button>
                </div>
            </div>
        </div>
    );
}
