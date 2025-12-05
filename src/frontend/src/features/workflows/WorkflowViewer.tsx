import { useState, useEffect } from 'react';
import { useAppSelector } from '@/app/hooks';
import { useGetWorkflowQuery } from '@/services/api';
import { useWorkflowSubscription } from '@/hooks/useWorkflowSubscription';
import OutlineEditor from './OutlineEditor';
import EditChangesList from './EditChangesList';
import SeoResultsView from './SeoResultsView';
import FinalDraftView from './FinalDraftView';
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
        editing: false,
        seo: false,
        final: false,
    });

    // State for toggling between original and edited draft
    const [showOriginal, setShowOriginal] = useState(false);

    // Automatically expand the current active stage
    useEffect(() => {
        if (!workflow) return;

        const newExpanded = { ...expandedSections };

        if (workflow.state === 'Final') {
            newExpanded.final = true;
            newExpanded.seo = true;
        } else if (workflow.state === 'Optimizing') {
            newExpanded.seo = true;
        } else if (workflow.state === 'Editing') {
            newExpanded.editing = true;
        } else if (['Drafting', 'Review'].includes(workflow.state)) {
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

    const getSeoStatus = () => {
        if (workflow.state === 'Optimizing') return 'active';
        if (workflow.data.seoData || workflow.state === 'Final') return 'completed';
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

                        // When in Final state, all stages are completed (including Final itself)
                        const isCompleted = workflow.state === 'Final'
                            ? true
                            : stageIndex < currentIndex;
                        const isCurrent = workflow.state !== 'Final' && stageIndex === currentIndex;

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

            {/* Selected Topic Display */}
            {workflow.topic && (
                <div className="card bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-1">Selected Topic</p>
                            <h4 className="text-lg font-semibold text-gray-900 leading-tight">{workflow.topic}</h4>
                            {workflow.tone && (
                                <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                    {workflow.tone.charAt(0).toUpperCase() + workflow.tone.slice(1)} Tone
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {/* Final Draft Section */}
                {workflow.state === 'Final' && workflow.data.draft && (
                    <FinalDraftView
                        content={workflow.data.draft.content}
                        isOpen={expandedSections.final}
                        onToggle={() => toggleSection('final')}
                        status="completed"
                    />
                )}

                {/* SEO Section */}
                {(workflow.data.seoData || ['Optimizing', 'Final'].includes(workflow.state)) && (
                    <div className="mb-6">
                        {workflow.state === 'Optimizing' && !workflow.data.seoData ? (
                            <CollapsibleSection
                                title="SEO Optimization"
                                status="active"
                                isOpen={expandedSections.seo}
                                onToggle={() => toggleSection('seo')}
                            >
                                <div className="flex flex-col items-center justify-center py-12">
                                    <LoadingSpinner size="lg" className="mb-4 text-green-500" />
                                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Optimizing for SEO...</h4>
                                    <p className="text-sm text-gray-500">Analyzing keywords, meta tags, and readability</p>
                                </div>
                            </CollapsibleSection>
                        ) : workflow.data.seoData ? (
                            <SeoResultsView
                                workflowId={workflow.id}
                                seoData={workflow.data.seoData}
                                isOpen={expandedSections.seo}
                                onToggle={() => toggleSection('seo')}
                                status={getSeoStatus()}
                            />
                        ) : null}
                    </div>
                )}

                {/* Editing Section */}
                {['Editing', 'Optimizing', 'Final'].includes(workflow.state) && (
                    <CollapsibleSection
                        title="Content Editing"
                        status={workflow.state === 'Editing' ? 'active' : 'completed'}
                        isOpen={expandedSections.editing}
                        onToggle={() => toggleSection('editing')}
                    >
                        {workflow.state === 'Editing' ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <LoadingSpinner size="lg" className="mb-4 text-purple-500" />
                                <h4 className="text-lg font-semibold text-gray-800 mb-2">Refining your content...</h4>
                                <p className="text-sm text-gray-500">Our AI editor is improving grammar, style, and flow</p>
                            </div>
                        ) : workflow.data.editedDraft ? (
                            <div className="space-y-4">
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

                                <div className="prose prose-sm max-w-none text-gray-700">
                                    <ReactMarkdown>
                                        {showOriginal
                                            ? (workflow.data.originalDraft || workflow.data.draft?.content || '')
                                            : workflow.data.editedDraft
                                        }
                                    </ReactMarkdown>
                                </div>

                                {!showOriginal && workflow.data.editChanges && (
                                    <EditChangesList changes={workflow.data.editChanges} className="mt-4" />
                                )}
                            </div>
                        ) : null}
                    </CollapsibleSection>
                )}

                {/* Draft Section */}
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

                                <div className="prose prose-sm max-w-none text-gray-700">
                                    <ReactMarkdown>
                                        {workflow.data.originalDraft || workflow.data.draft.content}
                                    </ReactMarkdown>
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
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8">
                                <LoadingSpinner size="lg" className="mb-4 text-blue-500" />
                                <p className="text-gray-500">Generating draft content...</p>
                            </div>
                        )}
                    </CollapsibleSection>
                )}

                {/* Outline Section */}
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

                {/* Research Section */}
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
