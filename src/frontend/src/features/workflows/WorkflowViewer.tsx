import { useState, useEffect } from 'react';
import { useAppSelector } from '@/app/hooks';
import { useGetWorkflowQuery } from '@/services/api';
import { useWorkflowSubscription } from '@/hooks/useWorkflowSubscription';
import OutlineEditor from './OutlineEditor';
import EditingView from './EditingView';
import EditChangesList from './EditChangesList';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ReactMarkdown from 'react-markdown';
import CollapsibleSection from '@/components/ui/CollapsibleSection';

export default function WorkflowViewer() {
    const currentWorkflow = useAppSelector((state) => state.workflow.currentWorkflow);

    // Subscribe to real-time updates via SignalR
    useWorkflowSubscription(currentWorkflow?.id);

    // Initial fetch only
    const { data: initialWorkflow } = useGetWorkflowQuery(
        currentWorkflow?.id || '',
        {
            skip: !currentWorkflow?.id,
        }
    );

    const workflow = currentWorkflow || initialWorkflow;

    // State for collapsible sections
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        draft: false,
        outline: false,
        research: false,
    });

    // State for toggling between original and edited draft
    const [showOriginal, setShowOriginal] = useState(false);

    // Automatically expand the current active stage
    useEffect(() => {
        if (!workflow) return;

        const newExpanded = { ...expandedSections };

        if (['Drafting', 'Review', 'Editing', 'Optimizing', 'Final'].includes(workflow.state)) {
            newExpanded.draft = true;
        } else if (['Outlining', 'WaitingApproval'].includes(workflow.state)) {
            newExpanded.outline = true;
        } else if (workflow.state === 'Researching' || workflow.state === 'Idle') {
            newExpanded.research = true;
        }

        setExpandedSections(newExpanded);
    }, [workflow?.state]);

    if (!workflow) {
        return null;
    }

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

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
            case 'Editing':
                return 'bg-purple-500';
            case 'Final':
                return 'bg-green-500';
            case 'Failed':
                return 'bg-red-500';
            case 'Idle':
            default:
                return 'bg-gray-500';
        }
    };

    // Determine status for each section
    const getResearchStatus = () => {
        if (workflow.state === 'Researching' || workflow.state === 'Idle') return 'active';
        if (workflow.data.research) return 'completed';
        // Infer completion if we are in a later stage
        if (['Outlining', 'WaitingApproval', 'Drafting', 'Review', 'Editing', 'Optimizing', 'Final'].includes(workflow.state)) return 'completed';
        return 'pending';
    };

    const getOutlineStatus = () => {
        if (workflow.state === 'Outlining' || workflow.state === 'WaitingApproval') return 'active';
        if (workflow.data.outline && ['Drafting', 'Review', 'Editing', 'Optimizing', 'Final'].includes(workflow.state)) return 'completed';
        return 'pending';
    };

    const getDraftStatus = () => {
        if (['Drafting', 'Review', 'Editing', 'Optimizing'].includes(workflow.state)) return 'active';
        if (workflow.state === 'Final') return 'completed';
        return 'pending';
    };


    return (
        <div className="space-y-6">
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">Workflow Progress</h3>
                    <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getStateColor(workflow.state)}`}>
                        {workflow.state}
                    </span>
                </div>

                {/* Progress Stages */}
                <div className="flex gap-2 mb-6">
                    {[
                        { key: 'Idle', label: 'Start' },
                        { key: 'Researching', label: 'Research' },
                        { key: 'Outlining', label: 'Outline' },
                        { key: 'WaitingApproval', label: 'Approval' },
                        { key: 'Drafting', label: 'Draft' },
                        { key: 'Editing', label: 'Edit' },
                        { key: 'Optimizing', label: 'Optimize' },
                        { key: 'Final', label: 'Final' },
                    ].map((stage) => {
                        const stageOrder = ['Idle', 'Researching', 'Outlining', 'WaitingApproval', 'Drafting', 'Editing', 'Optimizing', 'Final'];
                        const currentIndex = stageOrder.indexOf(workflow.state);
                        const stageIndex = stageOrder.indexOf(stage.key);

                        const isCompleted = stageIndex < currentIndex;
                        const isCurrent = stageIndex === currentIndex;

                        const getStageColor = () => {
                            if (isCompleted) return 'bg-green-500';
                            if (isCurrent) return 'bg-blue-500';
                            return 'bg-gray-300';
                        };

                        return (
                            <div key={stage.key} className="flex-1">
                                <div className={`h-2.5 rounded-full transition-all duration-500 ${getStageColor()}`}></div>
                                <p className="text-xs text-center mt-1 text-gray-600">{stage.label}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Current Step & Error Display */}
                <div>
                    <p className="text-sm text-gray-600 mb-1">Current Step</p>
                    <p className="text-base font-medium text-gray-800">{workflow.currentStep}</p>
                    {workflow.state === 'Failed' && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                            <strong>Error:</strong> The workflow encountered an issue. Please check the chat history for details.
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                {/* 1. Editing Section */}
                {['Editing', 'Optimizing', 'Final'].includes(workflow.state) && (
                    <CollapsibleSection
                        title="Content Editing"
                        status={workflow.state === 'Editing' ? 'active' : 'completed'}
                        isOpen={workflow.state === 'Editing'}
                        onToggle={() => toggleSection('editing')}
                    >
                        <EditingView
                            isEditing={workflow.state === 'Editing'}
                            editedContent={workflow.state !== 'Editing' ? (workflow.data.editedDraft || workflow.data.draft?.content) : undefined}
                            editChanges={workflow.data.editChanges}
                        />
                    </CollapsibleSection>
                )}

                {/* 2. Draft Section */}
                {(workflow.data.draft || ['Drafting', 'Review', 'Editing', 'Optimizing', 'Final'].includes(workflow.state)) && (
                    <CollapsibleSection
                        title="Draft Generation"
                        status={getDraftStatus()}
                        isOpen={expandedSections.draft}
                        onToggle={() => toggleSection('draft')}
                    >
                        {workflow.data.draft ? (
                            <div className="space-y-4">
                                <div className="border-b border-gray-100 pb-3">
                                    <h5 className="font-semibold text-lg text-gray-900">{workflow.data.draft.metaTitle}</h5>
                                    <p className="text-sm text-gray-500 mt-1">{workflow.data.draft.metaDescription}</p>
                                </div>

                                {workflow.data.editedDraft && (
                                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded mb-2">
                                        <span className="text-xs font-medium text-gray-500">
                                            {showOriginal ? 'Showing: Original Draft' : 'Showing: Edited Version'}
                                        </span>
                                        <button
                                            onClick={() => setShowOriginal(!showOriginal)}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            {showOriginal ? "Switch to Edited Version" : "View Original Draft"}
                                        </button>
                                    </div>
                                )}

                                <div className="prose prose-sm max-w-none text-gray-700">
                                    <ReactMarkdown>
                                        {showOriginal
                                            ? (workflow.data.originalDraft || workflow.data.draft.content)
                                            : (workflow.data.editedDraft || workflow.data.draft.content)
                                        }
                                    </ReactMarkdown>
                                </div>

                                {!showOriginal && workflow.data.editChanges && (
                                    <EditChangesList changes={workflow.data.editChanges} className="mt-4" />
                                )}

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
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8">
                                <LoadingSpinner size="lg" className="mb-4 text-blue-500" />
                                <p className="text-gray-500">Generating draft content...</p>
                            </div>
                        )}
                    </CollapsibleSection>
                )}

                {/* 3. Outline Section */}
                {(workflow.data.outline || ['Outlining', 'WaitingApproval'].includes(workflow.state) || getOutlineStatus() === 'completed') && (
                    <CollapsibleSection
                        title="Outline"
                        status={getOutlineStatus()}
                        isOpen={expandedSections.outline}
                        onToggle={() => toggleSection('outline')}
                    >
                        {workflow.data.outline ? (
                            <OutlineEditor
                                workflowId={workflow.id}
                                initialOutline={workflow.data.outline}
                                isReadOnly={workflow.state !== 'WaitingApproval'}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8">
                                <LoadingSpinner size="lg" className="mb-4 text-purple-500" />
                                <p className="text-gray-500">Generating outline structure...</p>
                            </div>
                        )}
                    </CollapsibleSection>
                )}

                {/* 3. Research Section (Bottom Priority) */}
                {(workflow.data.research || workflow.state === 'Researching' || workflow.state === 'Idle' || getResearchStatus() === 'completed') && (
                    <CollapsibleSection
                        title="Research Findings"
                        status={getResearchStatus()}
                        isOpen={expandedSections.research}
                        onToggle={() => toggleSection('research')}
                    >
                        {workflow.data.research ? (
                            <div className="prose prose-sm max-w-none text-gray-700 max-h-96 overflow-y-auto">
                                {typeof workflow.data.research === 'string' ? (
                                    <ReactMarkdown>{workflow.data.research}</ReactMarkdown>
                                ) : (
                                    <pre>{JSON.stringify(workflow.data.research, null, 2)}</pre>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8">
                                {['Outlining', 'WaitingApproval', 'Drafting', 'Review', 'Editing', 'Optimizing', 'Final'].includes(workflow.state) ? (
                                    <p className="text-gray-500 italic">No research data available.</p>
                                ) : (
                                    <>
                                        <LoadingSpinner size="lg" className="mb-4 text-blue-500" />
                                        <p className="text-gray-500">
                                            {workflow.state === 'Idle' ? 'Initializing workflow...' : 'Gathering research data...'}
                                        </p>
                                    </>
                                )}
                            </div>
                        )}
                    </CollapsibleSection>
                )}
            </div>
        </div>
    );
}
