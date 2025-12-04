import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ReactMarkdown from 'react-markdown';
import EditChangesList from './EditChangesList';

interface EditingViewProps {
    isEditing: boolean;
    editedContent?: string;
    editChanges?: string[];
}

export default function EditingView({ isEditing, editedContent, editChanges }: EditingViewProps) {
    if (isEditing) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <LoadingSpinner size="lg" className="mb-4 text-purple-500" />
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Refining your content...</h4>
                <p className="text-sm text-gray-500">Our AI editor is improving grammar, style, and flow</p>
            </div>
        );
    }

    if (editedContent) {
        return (
            <div className="space-y-4">
                <div className="flex items-center space-x-2 text-green-600 mb-4">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Content refined successfully!</span>
                </div>

                {/* Display changes summary */}
                {editChanges && (
                    <EditChangesList changes={editChanges} className="mb-4" />
                )}

                {/* Display edited content with green highlight */}
                <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-md">
                    <div className="flex items-center mb-3">
                        <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">✨ Edited Content</span>
                    </div>
                    <div className="prose prose-sm max-w-none text-gray-800">
                        <ReactMarkdown>{editedContent}</ReactMarkdown>
                    </div>
                </div>

                <p className="text-xs text-gray-500 italic">
                    The refined content has been applied to your draft. Grammar, clarity, and flow have been improved.
                </p>
            </div>
        );
    }

    return null;
}
