
import { SeoAnalysisResult } from '@/types';
import CollapsibleSection from '@/components/ui/CollapsibleSection';
import { useApplySeoSuggestionsMutation, useFinalizeWorkflowMutation } from '@/services/api';
import ReactMarkdown from 'react-markdown';

const Spinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

interface SeoResultsViewProps {
    workflowId: string;
    seoData: SeoAnalysisResult;
    isOpen: boolean;
    onToggle: () => void;
    status: 'active' | 'completed' | 'pending';
}

export default function SeoResultsView({ workflowId, seoData, isOpen, onToggle, status }: SeoResultsViewProps) {
    const [applySeoSuggestions, { isLoading: isApplying }] = useApplySeoSuggestionsMutation();
    const [finalizeWorkflow, { isLoading: isFinalizing }] = useFinalizeWorkflowMutation();

    const handleApply = async () => {
        try {
            await applySeoSuggestions(workflowId).unwrap();
        } catch (error) {
            console.error('Failed to apply SEO suggestions:', error);
        }
    };

    const handleSkip = async () => {
        try {
            await finalizeWorkflow(workflowId).unwrap();
        } catch (error) {
            console.error('Failed to finalize workflow:', error);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
        if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    return (
        <CollapsibleSection
            title="SEO Optimization"
            status={status}
            isOpen={isOpen}
            onToggle={onToggle}
        >
            <div className="space-y-6">
                {/* Score and Meta Tags */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Score Card */}
                    <div className={`p-4 rounded-lg border flex flex-col items-center justify-center ${getScoreColor(seoData.score)}`}>
                        <span className="text-3xl font-bold">{seoData.score}</span>
                        <span className="text-sm font-medium mt-1">SEO Score</span>
                    </div>

                    {/* Meta Tags */}
                    <div className="md:col-span-2 space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Meta Title</label>
                            <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-800 font-medium">
                                {seoData.metaTitle}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Meta Description</label>
                            <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
                                {seoData.metaDescription}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Keywords */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                        {seoData.keywords.map((keyword, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100">
                                {keyword}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Suggestions */}
                {seoData.suggestions.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Optimization Suggestions</h4>
                        <ul className="space-y-2">
                            {seoData.suggestions.map((suggestion, index) => (
                                <li key={index} className="flex items-start text-sm text-gray-600">
                                    <span className="mr-2 text-blue-500 mt-1">•</span>
                                    <div className="prose prose-sm max-w-none text-gray-600">
                                        <ReactMarkdown>{suggestion}</ReactMarkdown>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Actions */}
                {status === 'active' && (
                    <div className="pt-6 border-t border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-4">Complete Your Workflow</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Apply SEO Option */}
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h5 className="text-sm font-semibold text-blue-900">Apply SEO Optimizations</h5>
                                        <p className="text-xs text-blue-700 mt-1">
                                            Apply the suggested SEO improvements to your draft before finalizing.
                                        </p>
                                        <button
                                            onClick={handleApply}
                                            disabled={isApplying || isFinalizing}
                                            className="mt-3 w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                                        >
                                            {isApplying ? (
                                                <>
                                                    <Spinner />
                                                    Applying...
                                                </>
                                            ) : (
                                                'Apply & Finalize'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Accept As-Is Option */}
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h5 className="text-sm font-semibold text-green-900">Accept Final Draft</h5>
                                        <p className="text-xs text-green-700 mt-1">
                                            Accept the current draft as your final version without SEO changes.
                                        </p>
                                        <button
                                            onClick={handleSkip}
                                            disabled={isApplying || isFinalizing}
                                            className="mt-3 w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                                        >
                                            {isFinalizing ? (
                                                <>
                                                    <Spinner />
                                                    Finalizing...
                                                </>
                                            ) : (
                                                'Accept & Complete'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </CollapsibleSection>
    );
}
