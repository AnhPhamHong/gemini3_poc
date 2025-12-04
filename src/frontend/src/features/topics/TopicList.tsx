import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { selectTopic } from './topicSlice';
import { useCreateWorkflowMutation } from '@/services/api';
import { setCurrentWorkflow, setCreating, setError } from '@/features/workflows/workflowSlice';
import type { TopicSuggestion } from '@/types';
import { truncateText } from '@/utils/helpers';

export default function TopicList() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const suggestions = useAppSelector((state) => state.topics.suggestions);
    const selectedTopic = useAppSelector((state) => state.topics.selectedTopic);
    const currentWorkflow = useAppSelector((state) => state.workflow.currentWorkflow);
    const isCreating = useAppSelector((state) => state.workflow.isCreating);

    const [createWorkflow] = useCreateWorkflowMutation();

    if (suggestions.length === 0) {
        return null;
    }

    // Hide topic list after workflow is created
    if (currentWorkflow) {
        return null;
    }


    const handleSelectTopic = (topic: TopicSuggestion) => {
        dispatch(selectTopic(topic));
    };

    const handleStartGeneration = async () => {
        if (!selectedTopic) return;

        try {
            dispatch(setCreating(true));
            dispatch(setError(null));

            const workflow = await createWorkflow({
                topic: selectedTopic.title,
                tone: selectedTopic.tone
            }).unwrap();
            dispatch(setCurrentWorkflow(workflow));
            navigate(`/generate?id=${workflow.id}`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create workflow';
            dispatch(setError(errorMessage));
            console.error('Failed to create workflow:', err);
        } finally {
            dispatch(setCreating(false));
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Topic Suggestions</h2>
                {selectedTopic && !currentWorkflow && (
                    <button
                        onClick={handleStartGeneration}
                        disabled={isCreating}
                        className="btn btn-primary"
                    >
                        {isCreating ? 'Starting...' : 'Start Generation'}
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestions.map((topic, index) => (
                    <motion.div
                        key={topic.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`card cursor-pointer transition-all ${selectedTopic?.id === topic.id
                            ? 'ring-2 ring-primary-500 bg-primary-50'
                            : 'hover:shadow-xl'
                            }`}
                        onClick={() => handleSelectTopic(topic)}
                    >
                        {/* Topic Card Header */}
                        <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-800 flex-1">
                                {truncateText(topic.title, 60)}
                            </h3>
                            {selectedTopic?.id === topic.id && (
                                <svg
                                    className="w-6 h-6 text-primary-600 flex-shrink-0"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            )}
                        </div>

                        {/* Description */}
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{topic.description}</p>

                        {/* Metadata */}
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    {topic.tone}
                                </span>
                                <span className="text-gray-500">
                                    ~{topic.estimatedWordCount.toLocaleString()} words
                                </span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: Implement regeneration logic
                                    console.log('Regenerate topic:', topic.id);
                                }}
                                className="text-gray-400 hover:text-primary-600 transition-colors"
                                title="Regenerate Topic"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </div>

                        {/* Keywords */}
                        {topic.keywords && topic.keywords.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                                {topic.keywords.slice(0, 3).map((keyword, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800"
                                    >
                                        {keyword}
                                    </span>
                                ))}
                                {topic.keywords.length > 3 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-gray-600">
                                        +{topic.keywords.length - 3} more
                                    </span>
                                )}
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
