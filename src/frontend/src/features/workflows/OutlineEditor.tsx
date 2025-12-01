import { useState, useEffect } from 'react';
import { useApproveOutlineMutation, useRejectOutlineMutation } from '@/services/api';

interface OutlineEditorProps {
    workflowId: string;
    initialOutline: string;
    isReadOnly?: boolean;
}

export default function OutlineEditor({ workflowId, initialOutline, isReadOnly = false }: OutlineEditorProps) {
    const [outline, setOutline] = useState(initialOutline);
    const [feedback, setFeedback] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);

    const [approveOutline, { isLoading: isApproving }] = useApproveOutlineMutation();
    const [rejectOutline, { isLoading: isRejectingSubmit }] = useRejectOutlineMutation();

    // Update local state if initialOutline changes (e.g. from SignalR real-time updates)
    useEffect(() => {
        setOutline(initialOutline);
    }, [initialOutline]);

    const handleApprove = async () => {
        try {
            await approveOutline({ workflowId, notes: outline }).unwrap();
        } catch (error) {
            console.error('Failed to approve outline:', error);
        }
    };

    const handleReject = async () => {
        if (!feedback.trim()) return;

        try {
            await rejectOutline({ workflowId, feedback }).unwrap();
            setIsRejecting(false);
            setFeedback('');
        } catch (error) {
            console.error('Failed to reject outline:', error);
        }
    };

    if (isReadOnly) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Outline</h4>
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                    {outline}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-800">Review Outline</h4>
                <div className="text-sm text-gray-500">
                    Edit the outline below before approving.
                </div>
            </div>

            <textarea
                value={outline}
                onChange={(e) => setOutline(e.target.value)}
                className="w-full h-96 p-4 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="# Introduction..."
            />

            {isRejecting ? (
                <div className="mt-4 p-4 bg-red-50 rounded-md border border-red-100">
                    <label className="block text-sm font-medium text-red-800 mb-2">
                        Reason for rejection (required)
                    </label>
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="w-full h-24 p-2 border border-red-200 rounded-md text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="e.g., The outline is missing a section on..."
                    />
                    <div className="mt-3 flex space-x-3">
                        <button
                            onClick={handleReject}
                            disabled={isRejectingSubmit || !feedback.trim()}
                            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
                        >
                            {isRejectingSubmit ? 'Rejecting...' : 'Confirm Rejection'}
                        </button>
                        <button
                            onClick={() => setIsRejecting(false)}
                            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="mt-6 flex justify-end space-x-4">
                    <button
                        onClick={() => setIsRejecting(true)}
                        className="px-4 py-2 bg-white text-red-600 border border-red-200 text-sm font-medium rounded-md hover:bg-red-50"
                    >
                        Reject & Regenerate
                    </button>
                    <button
                        onClick={handleApprove}
                        disabled={isApproving}
                        className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                    >
                        {isApproving ? 'Approving...' : 'Approve Outline'}
                    </button>
                </div>
            )}
        </div>
    );
}
