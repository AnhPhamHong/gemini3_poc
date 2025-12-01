import { useEffect } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { setCurrentWorkflow } from '@/features/workflows/workflowSlice';
import signalRService from '@/services/signalRService';
import type { Workflow } from '@/types';

/**
 * Hook to subscribe to real-time workflow updates via SignalR
 * @param workflowId - The ID of the workflow to subscribe to
 * @param enabled - Whether the subscription should be active
 */
export function useWorkflowSubscription(workflowId: string | null | undefined, enabled = true) {
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (!workflowId || !enabled) {
            return;
        }

        let isSubscribed = true;

        const handleWorkflowUpdate = (workflow: Workflow) => {
            if (isSubscribed && workflow.id === workflowId) {
                console.log('Received workflow update:', workflow);
                dispatch(setCurrentWorkflow(workflow));
            }
        };

        const subscribeToWorkflow = async () => {
            try {
                // Initialize connection if needed
                await signalRService.initialize();

                // Join the workflow group
                await signalRService.joinWorkflowGroup(workflowId);

                // Subscribe to workflow updates
                signalRService.onWorkflowUpdated(handleWorkflowUpdate);

                console.log(`Subscribed to workflow updates: ${workflowId}`);
            } catch (error) {
                console.error('Failed to subscribe to workflow updates:', error);
            }
        };

        // Subscribe
        subscribeToWorkflow();

        // Cleanup function
        return () => {
            isSubscribed = false;

            // Unsubscribe from updates
            signalRService.offWorkflowUpdated(handleWorkflowUpdate);

            // Leave the workflow group
            if (workflowId) {
                signalRService.leaveWorkflowGroup(workflowId).catch((error) => {
                    console.error('Error leaving workflow group:', error);
                });
            }

            console.log(`Unsubscribed from workflow updates: ${workflowId}`);
        };
    }, [workflowId, enabled, dispatch]);
}
