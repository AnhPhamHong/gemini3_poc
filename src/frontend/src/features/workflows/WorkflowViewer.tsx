import { useAppSelector } from '@/app/hooks';
import { useGetWorkflowQuery } from '@/services/api';
import { useWorkflowSubscription } from '@/hooks/useWorkflowSubscription';
import OutlineEditor from './OutlineEditor';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ReactMarkdown from 'react-markdown';

export default function WorkflowViewer() {
    const currentWorkflow = useAppSelector((state) => state.workflow.currentWorkflow);

    // Subscribe to real-time updates via SignalR (no more polling!)
    useWorkflowSubscription(currentWorkflow?.id);

    // Initial fetch only (no polling)
    const { data: initialWorkflow } = useGetWorkflowQuery(
        currentWorkflow?.id || '',
        {
            skip: !currentWorkflow?.id,
            // No pollingInterval - using SignalR instead!
        }
    );

    // Use the current workflow from Redux (updated via SignalR) or initial fetch
    const workflow = currentWorkflow || initialWorkflow;

    if (!workflow) {
        return null;
    }

    const getStateColor = (state: string) => {
        switch (state) {
            case 'Researching':
            case 'Outlining':
            case 'Drafting':
            case 'Optimizing':
                return 'bg-blue-500';
            case 'WaitingApproval':
                return 'bg-yellow-500';
            case 'Review':
                return 'bg-purple-500';
            case 'Completed':
                return 'bg-green-500';
            case 'Failed':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Workflow Progress</h3>
                <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getStateColor(workflow.state)}`}>
                    {workflow.state}
                </span>
            </div>

            <div className="space-y-4">
                {/* Current Step */}
                <div>
                    <p className="text-sm text-gray-600 mb-1">Current Step</p>
                    <p className="text-base font-medium text-gray-800">{workflow.currentStep}</p>
                    {workflow.state === 'Failed' && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                            <strong>Error:</strong> The workflow encountered an issue. Please check the chat history for details.
                        </div>
                    )}
                </div>

                {/* Progress Timeline */}
                <div className="space-y-2">
                    <p className="text-sm text-gray-600 mb-2">Timeline</p>
                    <div className="flex items-center space-x-2">
                        {['Researching', 'Outlining', 'WaitingApproval', 'Drafting', 'Review', 'Completed'].map((step) => {
                            const stateIndex = ['Researching', 'Outlining', 'WaitingApproval', 'Drafting', 'Review', 'Optimizing', 'Completed'].indexOf(workflow.state);
                            const currentIndex = ['Researching', 'Outlining', 'WaitingApproval', 'Drafting', 'Review', 'Optimizing', 'Completed'].indexOf(step);
                            const isActive = currentIndex === stateIndex;
                            const isCompleted = currentIndex < stateIndex;

                            return (
                                <div key={step} className="flex-1">
                                    <div className={`h-2 rounded-full ${isCompleted ? 'bg-green-500' :
                                        isActive ? 'bg-blue-500' :
                                            'bg-gray-200'
                                        }`} />
                                    <p className={`text-xs mt-1 ${isActive || isCompleted ? 'text-gray-800 font-medium' : 'text-gray-500'
                                        }`}>
                                        {step.replace(/([A-Z])/g, ' $1').trim()}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Researching State Display */}
                {workflow.state === 'Researching' && (
                    <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <LoadingSpinner size="lg" className="mb-4 text-blue-500" />
                        <h4 className="text-lg font-medium text-gray-800">Researching Topic...</h4>
                        <p className="text-gray-500 mt-2 text-center max-w-md">
                            The agent is currently analyzing your topic, gathering relevant information, and preparing a comprehensive outline.
                        </p>
                    </div>
                )}

                {/* Data Sections - Split View */}
                <div className={`grid gap-6 ${workflow.data.outline && workflow.data.draft ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
                    {/* Research Section */}
                    {workflow.data.research && (
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Research Findings</h4>
                            <div className="prose prose-sm max-w-none text-gray-700 max-h-96 overflow-y-auto">
                                {typeof workflow.data.research === 'string' ? (
                                    <ReactMarkdown>{workflow.data.research}</ReactMarkdown>
                                ) : (
                                    <pre>{JSON.stringify(workflow.data.research, null, 2)}</pre>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Outline Section */}
                    {workflow.data.outline && (
                        <div className={workflow.state === 'WaitingApproval' ? 'col-span-full' : ''}>
                            <OutlineEditor
                                workflowId={workflow.id}
                                initialOutline={workflow.data.outline}
                                isReadOnly={workflow.state !== 'WaitingApproval'}
                            />
                        </div>
                    )}

                    {/* Draft Section */}
                    {workflow.data.draft && (
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Draft Preview</h4>
                            <div className="space-y-4">
                                <div className="border-b border-gray-100 pb-3">
                                    <h5 className="font-semibold text-lg text-gray-900">{workflow.data.draft.metaTitle}</h5>
                                    <p className="text-sm text-gray-500 mt-1">{workflow.data.draft.metaDescription}</p>
                                </div>

                                <div className="prose prose-sm max-w-none text-gray-700">
                                    {/* Simple rendering for now, would use a rich text viewer in real app */}
                                    {workflow.data.draft.content.split('\n').map((paragraph, idx) => (
                                        paragraph.trim() && <p key={idx} className="mb-2">{paragraph}</p>
                                    ))}
                                </div>

                                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs text-gray-500">SEO Score:</span>
                                        <span className={`text-sm font-bold ${workflow.data.draft.seoScore >= 80 ? 'text-green-600' :
                                            workflow.data.draft.seoScore >= 60 ? 'text-yellow-600' :
                                                'text-red-600'
                                            }`}>
                                            {workflow.data.draft.seoScore}/100
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        Last updated: {new Date(workflow.data.draft.lastUpdated).toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
