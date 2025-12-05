import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import { setCurrentView } from '@/features/ui/uiSlice';
import { useGetWorkflowsQuery } from '@/services/api';
import Pagination from '@/components/Pagination';
import WorkflowFilters from '@/components/WorkflowFilters';

export default function Dashboard() {
    const dispatch = useAppDispatch();
    const [searchParams, setSearchParams] = useSearchParams();

    // Parse query parameters
    const pageNumber = parseInt(searchParams.get('pageNumber') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const sortBy = searchParams.get('sortBy') || 'CreatedAt';
    const sortDescending = searchParams.get('sortDescending') !== 'false';
    const filterByState = searchParams.get('filterByState') || '';

    // Fetch workflows with pagination
    const { data, isLoading, error } = useGetWorkflowsQuery({
        pageNumber,
        pageSize,
        sortBy,
        sortDescending,
        filterByState,
    });

    useEffect(() => {
        dispatch(setCurrentView('dashboard'));
    }, [dispatch]);

    // Handlers for state updates
    const handlePageChange = (page: number) => {
        setSearchParams((prev) => {
            prev.set('pageNumber', page.toString());
            return prev;
        });
    };

    const handleSortChange = (field: string) => {
        setSearchParams((prev) => {
            prev.set('sortBy', field);
            prev.set('pageNumber', '1'); // Reset to first page on sort change
            return prev;
        });
    };

    const handleOrderChange = (descending: boolean) => {
        setSearchParams((prev) => {
            prev.set('sortDescending', descending.toString());
            prev.set('pageNumber', '1');
            return prev;
        });
    };

    const handleFilterChange = (state: string) => {
        setSearchParams((prev) => {
            if (state) {
                prev.set('filterByState', state);
            } else {
                prev.delete('filterByState');
            }
            prev.set('pageNumber', '1');
            return prev;
        });
    };

    if (isLoading) {
        return <div className="text-center py-8">Loading workflows...</div>;
    }

    if (error) {
        return <div className="text-center py-8 text-red-600">Error loading workflows</div>;
    }

    const workflows = data?.items || [];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="mt-2 text-gray-600">
                        Manage your content generation workflows.
                    </p>
                </div>
                <Link
                    to="/generate"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                    New Workflow
                </Link>
            </div>

            {/* Filters */}
            <WorkflowFilters
                sortBy={sortBy}
                sortDescending={sortDescending}
                filterByState={filterByState}
                onSortChange={handleSortChange}
                onOrderChange={handleOrderChange}
                onFilterChange={handleFilterChange}
            />

            {/* Workflows List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {workflows.map((workflow) => {
                        // Determine if workflow is actively processing
                        const isProcessing = ['Idle', 'Researching', 'Outlining', 'Drafting', 'Editing', 'Optimizing'].includes(workflow.state);
                        const isWaiting = workflow.state === 'WaitingApproval';
                        const isFailed = workflow.state === 'Failed';
                        const isCompleted = workflow.state === 'Final';

                        // Get badge styling based on state
                        const getBadgeStyle = () => {
                            if (isCompleted) return 'bg-green-100 text-green-800';
                            if (isFailed) return 'bg-red-100 text-red-800';
                            if (isWaiting) return 'bg-yellow-100 text-yellow-800';
                            if (isProcessing) return 'bg-blue-100 text-blue-800';
                            return 'bg-gray-100 text-gray-800';
                        };

                        return (
                            <li key={workflow.id}>
                                <Link to={`/generate?id=${workflow.id}`} className="block hover:bg-gray-50">
                                    <div className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-primary-600 truncate">
                                                {workflow.topic}
                                            </p>
                                            <div className="ml-2 flex-shrink-0 flex items-center space-x-2">
                                                {isProcessing && (
                                                    <svg
                                                        className="animate-spin h-4 w-4 text-blue-600"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <circle
                                                            className="opacity-25"
                                                            cx="12"
                                                            cy="12"
                                                            r="10"
                                                            stroke="currentColor"
                                                            strokeWidth="4"
                                                        />
                                                        <path
                                                            className="opacity-75"
                                                            fill="currentColor"
                                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                        />
                                                    </svg>
                                                )}
                                                <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeStyle()}`}>
                                                    {workflow.state}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2 sm:flex sm:justify-between">
                                            <div className="sm:flex">
                                                <p className="flex items-center text-sm text-gray-500">
                                                    {workflow.currentStep}
                                                </p>
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                <p>
                                                    Created on <time dateTime={workflow.createdAt}>{new Date(workflow.createdAt).toLocaleDateString()}</time>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        );
                    })}
                    {workflows.length === 0 && (
                        <li className="px-4 py-8 text-center text-gray-500">
                            No workflows found. Start by creating a new one!
                        </li>
                    )}
                </ul>

                {/* Pagination */}
                {data && (
                    <Pagination
                        currentPage={data.pageNumber}
                        totalPages={data.totalPages}
                        totalItems={data.totalCount}
                        pageSize={data.pageSize}
                        onPageChange={handlePageChange}
                    />
                )}
            </div>
        </div>
    );
}
