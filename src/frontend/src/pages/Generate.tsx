import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import { setCurrentView } from '@/features/ui/uiSlice';
import { setCurrentWorkflow, clearCurrentWorkflow } from '@/features/workflows/workflowSlice';
import { clearAllTopics } from '@/features/topics/topicSlice';
import { useGetWorkflowQuery } from '@/services/api';
import TopicInputForm from '@/features/topics/TopicInputForm';
import TopicList from '@/features/topics/TopicList';
import ProgressIndicator from '@/components/ProgressIndicator';
import WorkflowViewer from '@/features/workflows/WorkflowViewer';

export default function Generate() {
    const dispatch = useAppDispatch();
    const [searchParams] = useSearchParams();
    const workflowId = searchParams.get('id');

    // Fetch workflow if ID is present in URL
    const { data: workflow, isLoading } = useGetWorkflowQuery(
        workflowId || '',
        {
            skip: !workflowId,
        }
    );

    useEffect(() => {
        dispatch(setCurrentView('generate'));
    }, [dispatch]);

    // Update Redux state when workflow is loaded from URL
    useEffect(() => {
        if (workflow) {
            dispatch(setCurrentWorkflow(workflow));
        } else if (!workflowId) {
            // Clear workflow and topics if no ID in URL
            dispatch(clearCurrentWorkflow());
            dispatch(clearAllTopics());
        }
    }, [workflow, workflowId, dispatch]);

    if (isLoading && workflowId) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading workflow...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Generate Content</h1>
                <p className="mt-2 text-gray-600">
                    Generate blog topics and create compelling content with AI assistance.
                </p>
            </div>

            {/* Show appropriate content based on URL parameter */}
            {workflowId ? (
                <>
                    {/* Progress Indicator */}
                    <ProgressIndicator />

                    {/* Workflow Viewer - includes selected topic display */}
                    <WorkflowViewer />

                    {/* Topic Input Form - Show at bottom when workflow exists */}
                    <TopicInputForm />
                </>
            ) : (
                <>
                    {/* Topic Input Form - Show at top when creating new */}
                    <TopicInputForm />

                    {/* Topic List - Only show when no workflow */}
                    <TopicList />
                </>
            )}
        </div>
    );
}
