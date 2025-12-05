import { useState } from 'react';
import CollapsibleSection from '@/components/ui/CollapsibleSection';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

interface FinalDraftViewProps {
    content: string;
    isOpen: boolean;
    onToggle: () => void;
    status: 'active' | 'completed' | 'pending';
}

export default function FinalDraftView({ content, isOpen, onToggle, status }: FinalDraftViewProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        toast.success('Draft copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <CollapsibleSection
            title="Final Draft"
            subtitle="Workflow completed successfully"
            status={status}
            isOpen={isOpen}
            onToggle={onToggle}
        >
            <div className="space-y-4">
                {/* Success Banner */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-semibold text-green-900">Workflow Complete!</h4>
                            <p className="text-xs text-green-700 mt-0.5">
                                Your blog draft has been finalized and is ready to use.
                            </p>
                        </div>
                        <button
                            onClick={handleCopy}
                            className={`px-4 py-2 text-sm font-medium rounded transition-colors ${copied
                                ? 'bg-green-600 text-white'
                                : 'bg-white text-green-700 border border-green-300 hover:bg-green-100'
                                }`}
                        >
                            {copied ? (
                                <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Copied!
                                </span>
                            ) : (
                                <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Copy Draft
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Draft Content */}
                <div className="prose max-w-none p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <ReactMarkdown>{content}</ReactMarkdown>
                </div>
            </div>
        </CollapsibleSection>
    );
}
